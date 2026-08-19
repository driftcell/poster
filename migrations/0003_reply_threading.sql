-- Migration number: 0003 	 2026-08-19T15:30:00.000Z

-- 回复回信：每条回信也有自己的回信地址，并记录父回信
-- （存量回信的 reply_token 为 NULL，公开展示时不给回复地址即可）
ALTER TABLE replies ADD COLUMN reply_token TEXT;
ALTER TABLE replies ADD COLUMN parent_reply_id TEXT REFERENCES replies (id) ON DELETE SET NULL;
CREATE UNIQUE INDEX idx_replies_reply_token ON replies (reply_token);
