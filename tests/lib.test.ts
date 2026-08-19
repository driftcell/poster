import { describe, expect, it } from 'vitest';
import {
	hashSender,
	normalizeEmail,
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
});

describe('sanitizeFilename', () => {
	it('strips path traversal and unsafe chars', () => {
		expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
		expect(sanitizeFilename('..\\..\\win.png')).toBe('win.png');
		expect(sanitizeFilename('照片 1.jpg')).toBe('___1.jpg');
		expect(sanitizeFilename('')).toBe('file');
	});
});
