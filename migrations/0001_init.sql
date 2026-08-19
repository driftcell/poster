-- Migration number: 0001 	 2026-08-19T12:00:00.000Z

-- 信件：发件人投递到 poster@driftcell.dev 的邮件
CREATE TABLE letters (
	id TEXT PRIMARY KEY,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
	sender_hash TEXT NOT NULL,
	subject TEXT NOT NULL DEFAULT '',
	body_text TEXT NOT NULL DEFAULT '',
	r2_key TEXT NOT NULL,
	message_id TEXT UNIQUE,
	reply_token TEXT NOT NULL UNIQUE,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	published_at TEXT
);

-- 回信：投递到 poster+<reply_token>@driftcell.dev 的邮件，归属某封信件
CREATE TABLE replies (
	id TEXT PRIMARY KEY,
	letter_id TEXT NOT NULL REFERENCES letters (id) ON DELETE CASCADE,
	status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
	sender_hash TEXT NOT NULL,
	subject TEXT NOT NULL DEFAULT '',
	body_text TEXT NOT NULL DEFAULT '',
	r2_key TEXT NOT NULL,
	message_id TEXT UNIQUE,
	created_at TEXT NOT NULL DEFAULT (datetime('now')),
	published_at TEXT
);

-- 审核队列按状态 + 时间扫
CREATE INDEX idx_letters_status ON letters (status, created_at);
-- 某封信的回信列表
CREATE INDEX idx_replies_letter ON replies (letter_id, status, created_at);
