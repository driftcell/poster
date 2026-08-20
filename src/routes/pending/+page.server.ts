import { error } from '@sveltejs/kit';
import { listPendingLetters, listPublicPendingReplies } from '$lib/server/db';
import { excerpt, redact } from '$lib/text';
import { parseAttachments } from '$lib/types';
import type { PageServerLoad } from './$types';

// 公开待审核区域：未审核内容可能包含垃圾/隐私信息，
// 标题和正文在这里打码后才会下发，原始文本不出服务端
export const load: PageServerLoad = async ({ platform, setHeaders }) => {
	if (!platform) error(500, '平台不可用');
	// 队列随时在变，只挂短缓存兜底，不为它接审核动作的主动清缓存
	setHeaders({ 'cache-control': 'public, max-age=60' });
	const db = platform.env.DB;
	const [letters, replies] = await Promise.all([
		listPendingLetters(db),
		listPublicPendingReplies(db)
	]);
	const mask = (row: {
		id: string;
		sender_hash: string;
		subject: string;
		body_text: string;
		attachments: string;
		created_at: string;
	}) => ({
		id: row.id,
		senderHash: row.sender_hash,
		createdAt: row.created_at,
		subject: redact(row.subject),
		body: redact(excerpt(row.body_text)),
		bodyLength: row.body_text.length,
		attachmentCount: parseAttachments(row.attachments).length
	});
	return {
		letters: letters.map(mask),
		replies: replies.map((reply) => ({ ...mask(reply), letterSubject: reply.letter_subject }))
	};
};
