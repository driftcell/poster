// Atom 1.0 订阅源生成

export interface FeedEntry {
	title: string;
	/** 站点内路径，如 /letters/<id> */
	link: string;
	/** urn 用的唯一 id，如 letter:<uuid> */
	id: string;
	/** D1 datetime 字符串（"YYYY-MM-DD HH:MM:SS"，UTC） */
	updated: string;
	/** 纯文本正文 */
	content?: string;
}

export function escapeXml(value: string): string {
	return value
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;')
		.replace(/'/g, '&apos;');
}

/** D1 datetime('now') 产出 "YYYY-MM-DD HH:MM:SS"（UTC），转成 ISO 8601 */
export function toIsoDate(d1Date: string): string {
	return new Date(d1Date.replace(' ', 'T') + 'Z').toISOString();
}

export function buildAtomFeed(
	channel: { title: string; selfPath: string; homePath: string },
	entries: FeedEntry[],
	origin: string
): string {
	const updated = entries.length > 0 ? toIsoDate(entries[0].updated) : new Date(0).toISOString();
	const entriesXml = entries
		.map((entry) => {
			// type="html" 的内容本身要作为 HTML 处理，所以正文先转义、换行转 <br/>，整体再转义一次
			const content = entry.content
				? `\t\t<content type="html">${escapeXml(escapeXml(entry.content).replaceAll('\n', '<br/>\n'))}</content>\n`
				: '';
			return (
				`\t<entry>\n` +
				`\t\t<title>${escapeXml(entry.title)}</title>\n` +
				`\t\t<link href="${origin}${entry.link}" />\n` +
				`\t\t<id>urn:poster:${escapeXml(entry.id)}</id>\n` +
				`\t\t<updated>${toIsoDate(entry.updated)}</updated>\n` +
				content +
				`\t</entry>`
			);
		})
		.join('\n');

	return `<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
\t<title>${escapeXml(channel.title)}</title>
\t<link href="${origin}${channel.homePath}" />
\t<link rel="self" href="${origin}${channel.selfPath}" />
\t<id>${origin}${channel.homePath}</id>
\t<updated>${updated}</updated>
${entriesXml}
</feed>
`;
}

export function feedResponse(xml: string): Response {
	return new Response(xml, {
		headers: {
			'content-type': 'application/atom+xml; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
}
