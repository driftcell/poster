import PostalMime from 'postal-mime';
import type { Attachment } from 'postal-mime';
import {
	hashSender,
	replyTokenFor,
	sanitizeFilename,
	stripHtml,
	type IngestMessage
} from './lib';
import { autoModerate } from './moderate';
import type { AttachmentMeta } from '../src/lib/types';

// 只收图片附件：跳过小图标/签名图，限制数量和单个体积
const MAX_IMAGE_ATTACHMENTS = 5;
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MIN_IMAGE_BYTES = 20 * 1024;

/**
 * Queue 消费端：取 R2 原件 → 解析 MIME → 存图片附件 → 发件人哈希 → AI 审核 → 写 D1。
 * 单条失败只 retry 单条；Queue 配置的重试次数耗尽后自动进 DLQ。
 */
export const handleQueue: ExportedHandlerQueueHandler<Env, IngestMessage> = async (batch, env) => {
	for (const message of batch.messages) {
		try {
			if (batch.queue === 'email-ingest-dlq') {
				await recordFailure(env, message.body);
			} else {
				await processMessage(env, message.body);
			}
			message.ack();
		} catch (error) {
			console.error(`failed to process queue message ${message.id}`, error);
			message.retry();
		}
	}
};

async function processMessage(env: Env, payload: IngestMessage): Promise<void> {
	const object = await env.RAW_EMAILS.get(payload.r2Key);
	if (!object) {
		// R2 对象缺失是永久性错误，重试无意义，直接丢弃
		console.error(`r2 object missing: ${payload.r2Key}`);
		return;
	}

	const parsed = await PostalMime.parse(await object.arrayBuffer());
	const senderHash = await hashSender(env.HASH_SALT, payload.from);
	const subject = parsed.subject ?? '';
	const bodyText = parsed.text ?? (parsed.html ? stripHtml(parsed.html) : '');
	// Queue 至少一次投递，用 RFC Message-ID 去重（缺失时无法去重，插入即可）
	const messageId = parsed.messageId ?? null;

	// token 可能属于信件（回复信件）或某条回信（回复回信），先解析目标再处理，无效 token 不浪费资源
	let target: { letterId: string; parentReplyId: string | null } | null = null;
	if (payload.route.kind === 'reply') {
		target = await resolveReplyTarget(env.DB, payload.route.token);
		if (!target) {
			// token 无效是永久性错误，重试无意义
			console.error(`no letter or reply found for token: ${payload.route.token}`);
			return;
		}
	}

	const id = crypto.randomUUID();
	const attachments = await saveImageAttachments(env, id, parsed.attachments);
	const attachmentsJson = JSON.stringify(attachments);

	// AI 自动审核：通过则直接发布；不通过或服务异常都留在人工队列
	const verdict = await autoModerate(env.DEEPSEEK_API_KEY, {
		from: payload.from,
		to: payload.to,
		subject,
		body: attachments.length > 0 ? `${bodyText}\n（本邮件含 ${attachments.length} 张图片附件）` : bodyText
	});
	const status = verdict.approve ? 'approved' : 'pending';

	if (payload.route.kind === 'reply' && target) {
		const replyToken = await replyTokenFor(env.HASH_SALT, id);
		await env.DB.prepare(
			`INSERT INTO replies (id, letter_id, parent_reply_id, sender_hash, subject, body_text, r2_key, message_id, reply_token, status, review_note, attachments, published_at)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, CASE WHEN ?10 = 'approved' THEN datetime('now') ELSE NULL END)
			 ON CONFLICT (message_id) DO NOTHING`
		)
			.bind(
				id,
				target.letterId,
				target.parentReplyId,
				senderHash,
				subject,
				bodyText,
				payload.r2Key,
				messageId,
				replyToken,
				status,
				verdict.reason,
				attachmentsJson
			)
			.run();
		return;
	}

	const replyToken = await replyTokenFor(env.HASH_SALT, id);
	await env.DB.prepare(
		`INSERT INTO letters (id, sender_hash, subject, body_text, r2_key, message_id, reply_token, status, review_note, attachments, published_at)
		 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, CASE WHEN ?8 = 'approved' THEN datetime('now') ELSE NULL END)
		 ON CONFLICT (message_id) DO NOTHING`
	)
		.bind(
			id,
			senderHash,
			subject,
			bodyText,
			payload.r2Key,
			messageId,
			replyToken,
			status,
			verdict.reason,
			attachmentsJson
		)
		.run();
}

/** 解析回信地址 token：先查信件，查不到再查回信（回复回信） */
async function resolveReplyTarget(
	db: D1Database,
	token: string
): Promise<{ letterId: string; parentReplyId: string | null } | null> {
	const letter = await db
		.prepare('SELECT id FROM letters WHERE reply_token = ?1')
		.bind(token)
		.first<{ id: string }>();
	if (letter) return { letterId: letter.id, parentReplyId: null };

	const parent = await db
		.prepare('SELECT id, letter_id FROM replies WHERE reply_token = ?1')
		.bind(token)
		.first<{ id: string; letter_id: string }>();
	if (parent) return { letterId: parent.letter_id, parentReplyId: parent.id };

	return null;
}

/** 图片附件存 R2（attachments/<ownerId>/ 前缀），返回元数据 */
async function saveImageAttachments(
	env: Env,
	ownerId: string,
	attachments: Attachment[]
): Promise<AttachmentMeta[]> {
	const metas: AttachmentMeta[] = [];
	let index = 0;
	for (const attachment of attachments) {
		if (metas.length >= MAX_IMAGE_ATTACHMENTS) break;
		if (!attachment.mimeType.startsWith('image/')) continue;
		if (typeof attachment.content === 'string') continue;
		const size = attachment.content.byteLength;
		if (size < MIN_IMAGE_BYTES || size > MAX_IMAGE_BYTES) continue;

		const filename = sanitizeFilename(attachment.filename ?? `image-${index}`);
		const key = `attachments/${ownerId}/${index}-${filename}`;
		await env.RAW_EMAILS.put(key, attachment.content, {
			httpMetadata: { contentType: attachment.mimeType }
		});
		metas.push({
			key,
			filename: attachment.filename ?? filename,
			mimeType: attachment.mimeType,
			size
		});
		index++;
	}
	return metas;
}

/** DLQ 消息落库，等人工在后台查看/重放 */
async function recordFailure(env: Env, payload: IngestMessage): Promise<void> {
	await env.DB.prepare('INSERT INTO failed_ingest (id, payload) VALUES (?1, ?2)')
		.bind(crypto.randomUUID(), JSON.stringify(payload))
		.run();
}
