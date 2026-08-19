/**
 * 公开页面的响应带 cache-control 后会被 adapter 的边缘缓存（Cache API）缓存，
 * 内容变更时在这里主动失效。注意 Cache API 是按边缘节点（colo）隔离的，
 * 这里的删除只影响当前节点，属于 best-effort；max-age 兜底最坏情况。
 */
export async function purgePublicCache(
	platform: App.Platform,
	origin: string,
	paths: string[]
): Promise<void> {
	const cache = platform.caches.default;
	await Promise.all(paths.map((path) => cache.delete(new URL(path, origin).toString())));
}
