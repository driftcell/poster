-- Migration number: 0005 	 2026-08-19T16:30:00.000Z

-- 进死信队列的邮件处理任务，等人工查看/重放
CREATE TABLE failed_ingest (
	id TEXT PRIMARY KEY,
	payload TEXT NOT NULL,
	failed_at TEXT NOT NULL DEFAULT (datetime('now'))
);
