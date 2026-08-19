<script lang="ts">
	let { text, label = '复制' }: { text: string; label?: string } = $props();

	let copied = $state(false);
	let timer: ReturnType<typeof setTimeout> | undefined;

	async function copy() {
		try {
			await navigator.clipboard.writeText(text);
		} catch {
			// 非安全上下文 / 旧浏览器回退
			const textarea = document.createElement('textarea');
			textarea.value = text;
			textarea.style.position = 'fixed';
			textarea.style.opacity = '0';
			document.body.appendChild(textarea);
			textarea.select();
			document.execCommand('copy');
			textarea.remove();
		}
		copied = true;
		clearTimeout(timer);
		timer = setTimeout(() => (copied = false), 2000);
	}
</script>

<button type="button" class:copied onclick={copy}>
	<span class="icon" aria-hidden="true">
		{#if copied}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
				<polyline points="20 6 9 17 4 12" />
			</svg>
		{:else}
			<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
				<rect x="9" y="9" width="13" height="13" rx="2" />
				<path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
			</svg>
		{/if}
	</span>
	{label}
</button>

<style>
	button {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		padding: 0.125rem 0.625rem;
		border: 1px solid #bae6fd;
		border-radius: 999px;
		background: #fff;
		color: #0369a1;
		font-size: 0.8125rem;
		line-height: 1.6;
		cursor: pointer;
		white-space: nowrap;
		transition:
			background-color 0.15s ease,
			border-color 0.15s ease,
			color 0.15s ease;
	}
	button:hover {
		background: #e0f2fe;
	}
	.icon {
		display: inline-flex;
		width: 0.8125rem;
		height: 0.8125rem;
	}
	.icon svg {
		width: 100%;
		height: 100%;
	}
	/* 复制成功只换图标和配色，按钮尺寸不变（文案保持「复制」） */
	button.copied {
		border-color: #bbf7d0;
		background: #f0fdf4;
		color: #15803d;
	}
</style>
