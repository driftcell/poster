<script lang="ts">
	import { onMount, untrack } from 'svelte';

	/** D1 datetime 字符串（UTC "YYYY-MM-DD HH:MM:SS"） */
	let { time }: { time: string } = $props();

	const iso = $derived(time.replace(' ', 'T') + 'Z');
	// SSR 和首次水合都渲染 UTC 原文（untrack 明确表示只取初始值），onMount 后再替换为本地时间，避免水合不一致
	let text = $state(untrack(() => time));

	onMount(() => {
		text = new Date(iso).toLocaleString('zh-CN', {
			year: 'numeric',
			month: '2-digit',
			day: '2-digit',
			hour: '2-digit',
			minute: '2-digit',
			second: '2-digit',
			hour12: false
		});
	});
</script>

<time datetime={iso}>{text}</time>
