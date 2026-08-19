import { describe, expect, it } from 'vitest';
import {
	hashSender,
	normalizeEmail,
	pickBodyText,
	replyTokenFor,
	routeRecipient,
	sanitizeFilename,
	stripHtml
} from '../worker/lib';

describe('routeRecipient', () => {
	it('routes poster@ to letter', () => {
		expect(routeRecipient('poster@driftcell.dev')).toEqual({ kind: 'letter' });
	});

	it('routes poster+<token>@ to reply', () => {
		expect(routeRecipient('poster+0123456789abcdef@driftcell.dev')).toEqual({
			kind: 'reply',
			token: '0123456789abcdef'
		});
	});

	it('is case-insensitive on the local part', () => {
		expect(routeRecipient('POSTER@driftcell.dev')).toEqual({ kind: 'letter' });
		expect(routeRecipient('Poster+0123456789ABCDEF@driftcell.dev')).toEqual({
			kind: 'reply',
			token: '0123456789abcdef'
		});
	});

	it('rejects unknown addresses and malformed tokens', () => {
		expect(routeRecipient('other@driftcell.dev')).toBeNull();
		expect(routeRecipient('poster+@driftcell.dev')).toBeNull();
		expect(routeRecipient('poster+xyz@driftcell.dev')).toBeNull();
		expect(routeRecipient('poster+0123456789abcdef0@driftcell.dev')).toBeNull(); // 17 位
		expect(routeRecipient('no-at-sign')).toBeNull();
	});
});

describe('hashSender', () => {
	it('is deterministic', async () => {
		const a = await hashSender('salt', 'Alice@Example.com');
		const b = await hashSender('salt', 'alice@example.com');
		expect(a).toBe(b);
		expect(a).toMatch(/^[0-9a-f]{64}$/);
	});

	it('differs by salt', async () => {
		const a = await hashSender('salt-1', 'alice@example.com');
		const b = await hashSender('salt-2', 'alice@example.com');
		expect(a).not.toBe(b);
	});
});

describe('replyTokenFor', () => {
	it('is 16 hex chars and deterministic per id', async () => {
		const a = await replyTokenFor('salt', 'id-1');
		expect(a).toMatch(/^[0-9a-f]{16}$/);
		expect(await replyTokenFor('salt', 'id-1')).toBe(a);
		expect(await replyTokenFor('salt', 'id-2')).not.toBe(a);
	});
});

describe('normalizeEmail', () => {
	it('trims and lowercases', () => {
		expect(normalizeEmail('  Alice@Example.COM ')).toBe('alice@example.com');
	});
});

describe('stripHtml', () => {
	it('strips tags and keeps line breaks', () => {
		expect(stripHtml('<p>你好</p><p>第二段</p>')).toBe('你好\n第二段');
		expect(stripHtml('<b>加粗</b> 正常')).toBe('加粗 正常');
	});

	it('removes script/style content entirely', () => {
		expect(stripHtml('<style>body{color:red}</style><p>正文</p>')).toBe('正文');
		expect(stripHtml('<script>alert(1)</script><p>正文</p>')).toBe('正文');
	});

	it('decodes common entities', () => {
		expect(stripHtml('a &amp; b &lt;c&gt;')).toBe('a & b <c>');
	});

	it('turns div paragraphs into line breaks', () => {
		expect(stripHtml('<div>第一段</div><div>第二段<br></div><div>第三段</div>')).toBe(
			'第一段\n第二段\n\n第三段'
		);
	});

	it('collapses inline whitespace and trims each line', () => {
		expect(stripHtml('<p>  你好，\t 陌生人。  </p>')).toBe('你好， 陌生人。');
	});
});

describe('pickBodyText', () => {
	it('prefers text/plain when it has real line breaks', () => {
		expect(pickBodyText('第一段\n\n第二段', '<div>ignored</div>')).toBe('第一段\n\n第二段');
	});

	it('falls back to HTML when text/plain is flattened to one line (iCloud Webmail)', () => {
		const flattened = '你好，陌生人。 欢迎来到 Poster 邮局。 工作方式大概是：';
		const html =
			'<div>你好，陌生人。</div><div>欢迎来到 Poster 邮局。</div><div>工作方式大概是：</div>';
		expect(pickBodyText(flattened, html)).toBe(
			'你好，陌生人。\n欢迎来到 Poster 邮局。\n工作方式大概是：'
		);
	});

	it('ignores a trailing newline when judging whether plain text has structure', () => {
		expect(pickBodyText('一整段话\n', '<div>第一段</div><div>第二段</div>')).toBe('第一段\n第二段');
	});

	it('uses text/plain when there is no HTML part', () => {
		expect(pickBodyText('纯文本', undefined)).toBe('纯文本');
	});

	it('returns empty string when both parts are missing', () => {
		expect(pickBodyText(undefined, undefined)).toBe('');
	});
});

describe('sanitizeFilename', () => {
	it('strips path traversal and unsafe chars', () => {
		expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
		expect(sanitizeFilename('..\\..\\win.png')).toBe('win.png');
		expect(sanitizeFilename('照片 1.jpg')).toBe('___1.jpg');
		expect(sanitizeFilename('')).toBe('file');
	});
});
