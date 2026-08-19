import { error } from '@sveltejs/kit';
import { listPublishedLetters } from '$lib/server/db';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform, setHeaders }) => {
	if (!platform) error(500, '平台不可用');
	// adapter 生成的 worker 会把带 cache-control 的响应写入边缘缓存（Cache API）
	setHeaders({ 'cache-control': 'public, max-age=300' });
	const letters = await listPublishedLetters(platform.env.DB);
	return { letters };
};
