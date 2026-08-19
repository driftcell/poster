/**
 * 公开页面的响应带 cache-control 后会被 adapter 的边缘缓存（Cache API）缓存，
 * 内容变更时在这里主动失效。调用方有两处：admin 人工审核（platform.caches）
 * 和 queue 消费端的 AI 自动通过（全局 caches）。
 * 注意 Cache API 是按边缘节点（colo）隔离的，这里的删除只影响当前节点，
 * 属于 best-effort；max-age 兜底最坏情况。
 */
// 结构化类型：DOM lib 与 workers-types 的 Cache/CacheStorage 声明不完全兼容，这里只声明用到的最小面
export type CacheStore = { default: { delete: (url: string) => Promise<boolean> } };

export async function purgePublicCache(
	store: CacheStore,
	origin: string,
	paths: string[]
): Promise<void> {
	const cache = store.default;
	await Promise.all(paths.map((path) => cache.delete(new URL(path, origin).toString())));
}
