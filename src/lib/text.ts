/** 列表/摘要用的正文截断 */
export function excerpt(text: string, max = 160): string {
	return text.length > max ? text.slice(0, max) + '…' : text;
}

/**
 * 公开待审核区域用的结构打码：文字、数字、符号、emoji 一律替换为 █，
 * 只保留空白和标点，呈现文本的"形状"但不泄露内容。
 * 必须在服务端调用，原始文本不能下发到客户端。
 */
export function redact(text: string): string {
	return text.replace(/[^\s\p{P}]/gu, '█');
}

/** D1 datetime("YYYY-MM-DD HH:MM:SS", UTC) 转 ISO 8601 */
export function d1ToIso(d1Date: string): string {
	return d1Date.replace(' ', 'T') + 'Z';
}
