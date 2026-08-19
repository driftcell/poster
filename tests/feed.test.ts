import { describe, expect, it } from 'vitest';
import { buildAtomFeed, escapeXml, toIsoDate } from '../src/lib/server/feed';
import { d1ToIso, excerpt } from '../src/lib/text';

describe('escapeXml', () => {
	it('escapes all special chars', () => {
		expect(escapeXml(`<a href="x">&'</a>`)).toBe(
			'&lt;a href=&quot;x&quot;&gt;&amp;&apos;&lt;/a&gt;'
		);
	});
});

describe('toIsoDate', () => {
	it('converts D1 datetime to ISO', () => {
		expect(toIsoDate('2026-08-19 12:30:05')).toBe('2026-08-19T12:30:05.000Z');
	});
});

describe('buildAtomFeed', () => {
	const channel = { title: '测试', selfPath: '/atom.xml', homePath: '/' };

	it('renders a valid feed skeleton with entries', () => {
		const xml = buildAtomFeed(
			channel,
			[
				{
					title: '标题 <with> 特殊字符',
					link: '/letters/abc',
					id: 'letter:abc',
					updated: '2026-08-19 12:00:00',
					content: '正文\n换行'
				}
			],
			'https://example.com'
		);
		expect(xml).toContain('<feed xmlns="http://www.w3.org/2005/Atom">');
		expect(xml).toContain('<title>标题 &lt;with&gt; 特殊字符</title>');
		expect(xml).toContain('<id>urn:poster:letter:abc</id>');
		expect(xml).toContain('<updated>2026-08-19T12:00:00.000Z</updated>');
		// type="html" 的内容需要整体转义一次
		expect(xml).toContain('&lt;br/&gt;');
	});

	it('falls back to epoch for empty feed', () => {
		const xml = buildAtomFeed(channel, [], 'https://example.com');
		expect(xml).toContain('<updated>1970-01-01T00:00:00.000Z</updated>');
	});
});

describe('excerpt', () => {
	it('truncates long text with ellipsis', () => {
		const long = '字'.repeat(200);
		expect(excerpt(long)).toHaveLength(161);
		expect(excerpt('短')).toBe('短');
	});
});

describe('d1ToIso', () => {
	it('appends Z', () => {
		expect(d1ToIso('2026-08-19 01:02:03')).toBe('2026-08-19T01:02:03Z');
	});
});
