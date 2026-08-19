import sveltekit from '../.svelte-kit/cloudflare/_worker.js';
import { handleEmail } from './email';
import { handleQueue } from './queue';
import type { IngestMessage } from './lib';

// 包装 adapter-cloudflare 生成的 SvelteKit worker，追加 email/queue 入口。
// HTTP 请求仍全部交给 SvelteKit 处理。
// 注意：adapter 会覆盖 wrangler 配置里 main 指向的文件，所以构建侧用的是
// wrangler.adapter.jsonc（见 vite.config.ts），本文件不会被覆盖。
const handler: ExportedHandler<Env, IngestMessage> = {
	fetch: sveltekit.fetch as ExportedHandlerFetchHandler<Env>,
	email: handleEmail,
	queue: handleQueue
};

export default handler;
