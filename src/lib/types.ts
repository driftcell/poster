// 共享的数据库行类型，网站路由和 worker 消费端共用

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

/** 图片附件元数据（letters/replies 行的 attachments JSON 列解析结果） */
export interface AttachmentMeta {
	/** R2 对象 key，attachments/ 前缀 */
	key: string;
	filename: string;
	mimeType: string;
	size: number;
}

/** 解析行的 attachments JSON 列 */
export function parseAttachments(json: string): AttachmentMeta[] {
	try {
		const parsed: unknown = JSON.parse(json);
		return Array.isArray(parsed) ? (parsed as AttachmentMeta[]) : [];
	} catch {
		return [];
	}
}

export interface Letter {
	id: string;
	status: ModerationStatus;
	sender_hash: string;
	subject: string;
	body_text: string;
	r2_key: string;
	message_id: string | null;
	reply_token: string;
	review_note: string | null;
	attachments: string;
	created_at: string;
	published_at: string | null;
}

export interface Reply {
	id: string;
	letter_id: string;
	status: ModerationStatus;
	sender_hash: string;
	subject: string;
	body_text: string;
	r2_key: string;
	message_id: string | null;
	reply_token: string | null;
	parent_reply_id: string | null;
	review_note: string | null;
	attachments: string;
	created_at: string;
	published_at: string | null;
}
