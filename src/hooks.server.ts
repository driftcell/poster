import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';

// /admin 的外部流量由 Cloudflare Access 拦截（Dashboard 里配置 Access 应用），
// 这里再校验 Access 注入的邮箱头作为第二道防线。本地 vite dev 直接放行。
export const handle: Handle = async ({ event, resolve }) => {
	if (!dev && event.url.pathname.startsWith('/admin')) {
		const email = event.request.headers.get('cf-access-authenticated-user-email');
		const expected = event.platform?.env.ADMIN_EMAIL;
		if (!email || !expected || email.toLowerCase() !== expected.toLowerCase()) {
			return new Response('Forbidden', { status: 403 });
		}
	}
	return resolve(event);
};
