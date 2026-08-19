import { error } from '@sveltejs/kit';
import { getPublishedLetter, listPublishedReplies } from '$lib/server/db';
import { buildAtomFeed, feedResponse } from '$lib/server/feed';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, platform, url }) => {
	if (!platform) error(500, '平台不可用');
	const letter = await getPublishedLetter(platform.env.DB, params.id);
	if (!letter) error(404, '信件不存在或未公开');
	const replies = await listPublishedReplies(platform.env.DB, letter.id);
	const xml = buildAtomFeed(
		{
			title: `回信 · ${letter.subject || '（无主题）'}`,
			selfPath: `/letters/${letter.id}/atom.xml`,
			homePath: `/letters/${letter.id}`
		},
		replies.map((reply) => ({
			title: reply.subject || '（无主题）',
			link: `/letters/${letter.id}#${reply.id}`,
			id: `reply:${reply.id}`,
			updated: reply.published_at ?? reply.created_at,
			content: reply.body_text
		})),
		url.origin
	);
	return feedResponse(xml);
};
