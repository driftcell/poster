import { error } from '@sveltejs/kit';
import { listPublishedLetters } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform) error(500, '平台不可用');
	const letters = await listPublishedLetters(platform.env.DB);
	return { letters };
};
