<script lang="ts">
	import { resolve } from '$app/paths';
	import LocalTime from '$lib/LocalTime.svelte';
	import { pseudonymFor } from '$lib/pseudonym';
	import { excerpt } from '$lib/text';

	let { data } = $props();
</script>

<svelte:head>
	<title>Poster 邮局</title>
	<meta
		name="description"
		content="Poster 邮局 —— 通过电子邮件投稿的公开信箱，来信审核后公开展示。"
	/>
</svelte:head>

<aside class="cta">
	给 <a href="mailto:poster@driftcell.dev">poster@driftcell.dev</a> 写一封邮件，通过审核后会出现在这里。
</aside>

{#if data.letters.length === 0}
	<p class="empty">还没有公开的信件。</p>
{:else}
	<ul class="letters">
		{#each data.letters as letter (letter.id)}
			<li>
				<a href={resolve('/letters/[id]', { id: letter.id })}>
					<h2>{letter.subject || '（无主题）'}</h2>
				</a>
				{#if letter.body_text}
					<p class="excerpt">{excerpt(letter.body_text)}</p>
				{/if}
				<p class="byline">
					<span class="author">{pseudonymFor(letter.sender_hash)}</span> ·
					<LocalTime time={letter.published_at ?? letter.created_at} />
				</p>
			</li>
		{/each}
	</ul>
{/if}

<style>
	.letters {
		list-style: none;
		padding: 0;
		margin: 0;
	}
	.letters li {
		padding: 1.25rem 0;
		border-bottom: 1px solid #e5e7eb;
	}
	.letters li:last-child {
		border-bottom: none;
	}
	.letters a {
		text-decoration: none;
		color: inherit;
	}
	.letters a:hover h2 {
		color: #0369a1;
	}
	h2 {
		margin: 0 0 0.5rem;
		font-size: 1.25rem;
	}
	.excerpt {
		margin: 0 0 0.5rem;
		color: #4b5563;
	}
	.letters :global(time) {
		font-size: 0.875rem;
		color: #9ca3af;
	}
	.byline {
		margin: 0;
		font-size: 0.875rem;
		color: #9ca3af;
	}
	.author {
		color: #6b7280;
	}
	.cta {
		margin: 0 0 1.5rem;
		padding: 0.875rem 1rem;
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		border-radius: 0.5rem;
		font-size: 0.9375rem;
	}
	.empty {
		color: #6b7280;
	}
</style>
