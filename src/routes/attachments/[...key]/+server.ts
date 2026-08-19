import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

// 只暴露 attachments/ 前缀（raw/ 下的原始邮件永不对公网开放）
export const GET: RequestHandler = async ({ params, platform }) => {
	if (!platform) error(500, '平台不可用');
	const object = await platform.env.RAW_EMAILS.get(`attachments/${params.key}`);
	if (!object) error(404, '附件不存在');

	const headers = new Headers();
	object.writeHttpMetadata(headers);
	headers.set('etag', object.httpEtag);
	// key 含内容唯一的 id，可以永久缓存
	headers.set('cache-control', 'public, max-age=31536000, immutable');
	return new Response(object.body, { headers });
};
