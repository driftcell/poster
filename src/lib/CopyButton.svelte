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
	{copied ? '已复制' : label}
</button>

<style>
	button {
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
			border-color 0.15s ease;
	}
	button:hover {
		background: #e0f2fe;
	}
	button.copied {
		border-color: #bbf7d0;
		background: #f0fdf4;
		color: #15803d;
	}
</style>
