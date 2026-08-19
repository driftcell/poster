// 共享的数据库行类型，网站路由和 worker 消费端共用

export type ModerationStatus = 'pending' | 'approved' | 'rejected';

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
	created_at: string;
	published_at: string | null;
}
