import type { Letter, Reply } from '$lib/types';

const LIST_LIMIT = 100;

/** 待审核信件（最新的在前） */
export async function listPendingLetters(db: D1Database): Promise<Letter[]> {
	const { results } = await db
		.prepare("SELECT * FROM letters WHERE status = 'pending' ORDER BY created_at DESC LIMIT ?1")
		.bind(LIST_LIMIT)
		.all<Letter>();
	return results;
}

export type ReplyWithLetter = Reply & { letter_subject: string };

/** 待审核回信，带上原信件标题方便对照 */
export async function listPendingReplies(db: D1Database): Promise<ReplyWithLetter[]> {
	const { results } = await db
		.prepare(
			`SELECT replies.*, letters.subject AS letter_subject
			 FROM replies JOIN letters ON letters.id = replies.letter_id
			 WHERE replies.status = 'pending'
			 ORDER BY replies.created_at DESC LIMIT ?1`
		)
		.bind(LIST_LIMIT)
		.all<ReplyWithLetter>();
	return results;
}

/** 已发布回信（管理页用），带原信标题 */
export async function listPublishedRepliesJoined(db: D1Database): Promise<ReplyWithLetter[]> {
	const { results } = await db
		.prepare(
			`SELECT replies.*, letters.subject AS letter_subject
			 FROM replies JOIN letters ON letters.id = replies.letter_id
			 WHERE replies.status = 'approved'
			 ORDER BY replies.published_at DESC LIMIT ?1`
		)
		.bind(LIST_LIMIT)
		.all<ReplyWithLetter>();
	return results;
}

/** 审核信件：approved 时记录发布时间 */
export async function moderateLetter(
	db: D1Database,
	id: string,
	status: 'approved' | 'rejected'
): Promise<void> {
	await db
		.prepare(
			`UPDATE letters
			 SET status = ?1, published_at = CASE WHEN ?1 = 'approved' THEN datetime('now') ELSE NULL END
			 WHERE id = ?2 AND status = 'pending'`
		)
		.bind(status, id)
		.run();
}

/** 审核回信：approved 时记录发布时间 */
export async function moderateReply(
	db: D1Database,
	id: string,
	status: 'approved' | 'rejected'
): Promise<void> {
	await db
		.prepare(
			`UPDATE replies
			 SET status = ?1, published_at = CASE WHEN ?1 = 'approved' THEN datetime('now') ELSE NULL END
			 WHERE id = ?2 AND status = 'pending'`
		)
		.bind(status, id)
		.run();
}

/** 已发布信件（首页 / Atom 订阅） */
export async function listPublishedLetters(db: D1Database): Promise<Letter[]> {
	const { results } = await db
		.prepare("SELECT * FROM letters WHERE status = 'approved' ORDER BY published_at DESC LIMIT ?1")
		.bind(LIST_LIMIT)
		.all<Letter>();
	return results;
}

/** 单封已发布信件 */
export async function getPublishedLetter(db: D1Database, id: string): Promise<Letter | null> {
	return db
		.prepare("SELECT * FROM letters WHERE id = ?1 AND status = 'approved'")
		.bind(id)
		.first<Letter>();
}

/** 某封信的已发布回信 */
export async function listPublishedReplies(db: D1Database, letterId: string): Promise<Reply[]> {
	const { results } = await db
		.prepare(
			"SELECT * FROM replies WHERE letter_id = ?1 AND status = 'approved' ORDER BY published_at"
		)
		.bind(letterId)
		.all<Reply>();
	return results;
}

/** 查回信所属的信件 id（缓存清除用） */
export async function getReplyLetterId(db: D1Database, id: string): Promise<string | null> {
	const row = await db
		.prepare('SELECT letter_id FROM replies WHERE id = ?1')
		.bind(id)
		.first<{ letter_id: string }>();
	return row?.letter_id ?? null;
}

export interface FailedIngest {
	id: string;
	payload: string;
	failed_at: string;
}

/** 投递失败（DLQ 落库）的消息 */
export async function listFailedIngest(db: D1Database): Promise<FailedIngest[]> {
	const { results } = await db
		.prepare('SELECT * FROM failed_ingest ORDER BY failed_at DESC LIMIT 100')
		.all<FailedIngest>();
	return results;
}

export async function getFailedIngest(db: D1Database, id: string): Promise<FailedIngest | null> {
	return db.prepare('SELECT * FROM failed_ingest WHERE id = ?1').bind(id).first<FailedIngest>();
}

export async function deleteFailedIngest(db: D1Database, id: string): Promise<void> {
	await db.prepare('DELETE FROM failed_ingest WHERE id = ?1').bind(id).run();
}
