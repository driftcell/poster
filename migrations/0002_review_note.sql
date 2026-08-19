-- Migration number: 0002 	 2026-08-19T14:00:00.000Z

-- AI 自动审核的判定理由（人工审核时为 NULL）
ALTER TABLE letters ADD COLUMN review_note TEXT;
ALTER TABLE replies ADD COLUMN review_note TEXT;
