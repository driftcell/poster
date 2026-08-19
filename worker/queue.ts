import PostalMime from 'postal-mime';
import { hashSender, replyTokenFor, stripHtml, type IngestMessage } from './lib';

/**
 * Queue 消费端：取 R2 原件 → 解析 MIME → 发件人哈希 → 写 D1（pending）。
 * 单条失败只 retry 单条；Queue 配置的重试次数耗尽后自动进 DLQ。
 */
export const handleQueue: ExportedHandlerQueueHandler<Env, IngestMessage> = async (batch, env) => {
	for (const message of batch.messages) {
		try {
			await processMessage(message.body, env);
			message.ack();
		} catch (error) {
			console.error(`failed to process queue message ${message.id}`, error);
			message.retry();
		}
	}
};

async function processMessage(payload: IngestMessage, env: Env): Promise<void> {
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

	if (payload.route.kind === 'reply') {
		const letter = await env.DB.prepare('SELECT id FROM letters WHERE reply_token = ?1')
			.bind(payload.route.token)
			.first<{ id: string }>();
		if (!letter) {
			// token 无效是永久性错误，重试无意义
			console.error(`no letter found for reply token: ${payload.route.token}`);
			return;
		}
		await env.DB.prepare(
			`INSERT INTO replies (id, letter_id, sender_hash, subject, body_text, r2_key, message_id)
			 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
			 ON CONFLICT (message_id) DO NOTHING`
		)
			.bind(crypto.randomUUID(), letter.id, senderHash, subject, bodyText, payload.r2Key, messageId)
			.run();
		return;
	}

	const id = crypto.randomUUID();
	const replyToken = await replyTokenFor(env.HASH_SALT, id);
	await env.DB.prepare(
		`INSERT INTO letters (id, sender_hash, subject, body_text, r2_key, message_id, reply_token)
		 VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)
		 ON CONFLICT (message_id) DO NOTHING`
	)
		.bind(id, senderHash, subject, bodyText, payload.r2Key, messageId, replyToken)
		.run();
}
