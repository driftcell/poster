import { error } from '@sveltejs/kit';
import { listPublishedLetters } from '$lib/server/db';
import { buildAtomFeed, feedResponse } from '$lib/server/feed';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ platform, url }) => {
	if (!platform) error(500, '平台不可用');
	const letters = await listPublishedLetters(platform.env.DB);
	const xml = buildAtomFeed(
		{ title: 'Poster 邮局', selfPath: '/atom.xml', homePath: '/' },
		letters.map((letter) => ({
			title: letter.subject || '（无主题）',
			link: `/letters/${letter.id}`,
			id: `letter:${letter.id}`,
			updated: letter.published_at ?? letter.created_at,
			content: letter.body_text
		})),
		url.origin
	);
	return feedResponse(xml);
};
