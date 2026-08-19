import adapter from '@sveltejs/adapter-cloudflare';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

export default defineConfig({
	plugins: [
		sveltekit({
			compilerOptions: {
				// Force runes mode for the project, except for libraries. Can be removed in svelte 6.
				runes: ({ filename }) =>
					filename.split(/[/\\]/).includes('node_modules') ? undefined : true
			},

			// Build for Cloudflare Workers with Static Assets.
			// See https://svelte.dev/docs/kit/adapter-cloudflare for more information.
			// wrangler.adapter.jsonc 仅供 adapter 构建使用：adapter 会把生成的 worker
			// 写到其中 main 指定的路径（.svelte-kit/cloudflare/_worker.js）。
			// 部署侧的 wrangler.jsonc 以 worker/index.ts 为入口（包装生成物，追加
			// email/queue handler），两者不可混淆。
			adapter: adapter({ config: 'wrangler.adapter.jsonc' })
		})
	]
});
