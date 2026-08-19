import { error } from '@sveltejs/kit';
import { getPublishedLetter, listPublishedReplies } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, platform }) => {
	if (!platform) error(500, '平台不可用');
	const letter = await getPublishedLetter(platform.env.DB, params.id);
	if (!letter) error(404, '信件不存在或未公开');
	const replies = await listPublishedReplies(platform.env.DB, letter.id);
	return {
		letter,
		replies,
		replyAddress: `poster+${letter.reply_token}@driftcell.dev`
	};
};
