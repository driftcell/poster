import { error } from '@sveltejs/kit';
import { listPublishedLetters } from '$lib/server/db';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, url }) => {
	if (!platform) error(500, '平台不可用');
	const letters = await listPublishedLetters(platform.env.DB);

	const entries = letters
		.map((letter) => {
			const lastmod = (letter.published_at ?? letter.created_at).slice(0, 10);
			return `\t<url>\n\t\t<loc>${url.origin}/letters/${letter.id}</loc>\n\t\t<lastmod>${lastmod}</lastmod>\n\t</url>`;
		})
		.join('\n');

	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
\t<url>
\t\t<loc>${url.origin}/</loc>
\t</url>
${entries}
</urlset>
`;
	return new Response(xml, {
		headers: {
			'content-type': 'application/xml; charset=utf-8',
			'cache-control': 'public, max-age=300'
		}
	});
};
