/** 列表/摘要用的正文截断 */
export function excerpt(text: string, max = 160): string {
	return text.length > max ? text.slice(0, max) + '…' : text;
}

/** D1 datetime("YYYY-MM-DD HH:MM:SS", UTC) 转 ISO 8601 */
export function d1ToIso(d1Date: string): string {
	return d1Date.replace(' ', 'T') + 'Z';
}
