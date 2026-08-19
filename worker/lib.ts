// 邮件处理的纯函数工具：收件地址分流、发件人哈希、回信 token

/** poster@ 是新信件，poster+<token>@ 是回信，其余地址拒收 */
export type RecipientRoute = { kind: 'letter' } | { kind: 'reply'; token: string };

/** 投递到 Queue 的消息体（原始邮件太大，只传 R2 key） */
export interface IngestMessage {
	r2Key: string;
	from: string;
	to: string;
	route: RecipientRoute;
	receivedAt: string;
}

const REPLY_TOKEN_PATTERN = /^[0-9a-f]{16}$/;

export function routeRecipient(to: string): RecipientRoute | null {
	const localPart = to.split('@')[0]?.trim().toLowerCase();
	if (!localPart) return null;
	if (localPart === 'poster') return { kind: 'letter' };
	if (localPart.startsWith('poster+')) {
		const token = localPart.slice('poster+'.length);
		if (REPLY_TOKEN_PATTERN.test(token)) return { kind: 'reply', token };
	}
	return null;
}

export function normalizeEmail(address: string): string {
	return address.trim().toLowerCase();
}

async function hmacSha256Hex(secret: string, data: string): Promise<string> {
	const key = await crypto.subtle.importKey(
		'raw',
		new TextEncoder().encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
	return Array.from(new Uint8Array(signature), (b) => b.toString(16).padStart(2, '0')).join('');
}

/** 发件人哈希：加盐 HMAC，彩虹表不可反查 */
export function hashSender(secret: string, address: string): Promise<string> {
	return hmacSha256Hex(secret, `sender:${normalizeEmail(address)}`);
}

/** 回信地址里的 token：按信件 id 派生，16 位 hex */
export async function replyTokenFor(secret: string, letterId: string): Promise<string> {
	const hex = await hmacSha256Hex(secret, `reply:${letterId}`);
	return hex.slice(0, 16);
}

/** 邮件没有 text/plain 时的兜底：从 html 提取可读文本 */
export function stripHtml(html: string): string {
	return html
		.replace(/<style[\s\S]*?<\/style>/gi, '')
		.replace(/<script[\s\S]*?<\/script>/gi, '')
		.replace(/<br\s*\/?>/gi, '\n')
		.replace(/<\/(p|div|li|tr|h[1-6])>/gi, '\n')
		.replace(/<[^>]+>/g, '')
		.replace(/&nbsp;/g, ' ')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&amp;/g, '&')
		.replace(/\n{3,}/g, '\n\n')
		.trim();
}

/** 附件文件名消毒：只保留安全字符，防路径穿越 */
export function sanitizeFilename(name: string): string {
	const base = name.split(/[\\/]/).pop() ?? '';
	const clean = base.replace(/[^a-zA-Z0-9._-]/g, '_').replace(/^\.+/, '');
	return clean || 'file';
}
