<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import { resolve } from '$app/paths';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link
		rel="alternate"
		type="application/atom+xml"
		title="Poster 邮局"
		href={resolve('/atom.xml')}
	/>
</svelte:head>

<div class="container">
	<header class="site-header">
		<a class="brand" href={resolve('/')}>Poster 邮局</a>
		<nav>
			<a href={resolve('/atom.xml')}>订阅</a>
		</nav>
	</header>

	<main>
		{@render children()}
	</main>
</div>

<style>
	:global(*) {
		box-sizing: border-box;
	}
	:global(html) {
		/* 中文标点悬挂，段首的引号/括号不挤压文本框 */
		hanging-punctuation: first allow-end;
	}
	:global(body) {
		margin: 0;
		font-family:
			system-ui,
			-apple-system,
			'Segoe UI',
			Roboto,
			'PingFang SC',
			'Hiragino Sans GB',
			'Microsoft YaHei',
			'Noto Sans CJK SC',
			sans-serif;
		font-size: 1.0625rem;
		line-height: 1.8;
		color: #1f2328;
		background: #f6f5f2;
	}
	:global(::selection) {
		background: #bae6fd;
	}
	:global(:focus-visible) {
		outline: 2px solid #0369a1;
		outline-offset: 2px;
		border-radius: 2px;
	}
	:global(a) {
		color: #0369a1;
	}
	.container {
		max-width: 42rem;
		margin: 0 auto;
		padding: 1.5rem 1rem 3rem;
	}
	.site-header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		padding-bottom: 1rem;
		margin-bottom: 1.5rem;
		border-bottom: 1px solid #e5e2dc;
	}
	.brand {
		font-size: 1.25rem;
		font-weight: 700;
		text-decoration: none;
		color: inherit;
	}
	.site-header nav a {
		color: #6b7280;
		text-decoration: none;
		font-size: 0.9375rem;
	}
	.site-header nav a:hover {
		color: #0369a1;
	}
</style>
