-- Migration number: 0004 	 2026-08-19T16:00:00.000Z

-- 图片附件元数据（JSON 数组：{key, filename, mimeType, size}），原始文件存 R2 attachments/ 前缀
ALTER TABLE letters ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]';
ALTER TABLE replies ADD COLUMN attachments TEXT NOT NULL DEFAULT '[]';
