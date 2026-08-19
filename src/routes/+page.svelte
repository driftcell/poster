<script lang="ts">
	import { resolve } from '$app/paths';
	import CopyButton from '$lib/CopyButton.svelte';
	import LocalTime from '$lib/LocalTime.svelte';
	import { pseudonymFor } from '$lib/pseudonym';
	import { excerpt } from '$lib/text';

	let { data } = $props();
</script>

<svelte:head>
	<title>Poster 邮局</title>
	<meta name="description" content="Poster 邮局 —— 通过电子邮件投稿的公开信箱，来信会公开展示。" />
</svelte:head>

<aside class="cta">
	给
	<span class="address-row">
		<a class="address" href="mailto:poster@driftcell.dev">poster@driftcell.dev</a><CopyButton
			text="poster@driftcell.dev"
		/>
	</span>
	写一封邮件（主题可留空），它会出现在这里。
</aside>

{#if data.letters.length === 0}
	<p class="empty">还没有公开的信件。</p>
{:else}
	<ul class="letters">
		{#each data.letters as letter (letter.id)}
			<li>
				<a href={resolve('/letters/[id]', { id: letter.id })}>
					<h2>{letter.subject || '（无主题）'}</h2>
					{#if letter.body_text}
						<p class="excerpt">{excerpt(letter.body_text)}</p>
					{/if}
					<p class="byline">
						<span class="author">{pseudonymFor(letter.sender_hash)}</span>
						<LocalTime time={letter.published_at ?? letter.created_at} seconds={false} />
					</p>
				</a>
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
		border-bottom: 1px solid #e5e2dc;
	}
	.letters li:last-child {
		border-bottom: none;
	}
	.letters a {
		display: block;
		padding: 1.25rem 0.75rem;
		margin: 0 -0.75rem;
		border-radius: 0.5rem;
		text-decoration: none;
		color: inherit;
		transition: background-color 0.15s ease;
	}
	.letters a:hover {
		background: #f0ede7;
	}
	.letters a:hover h2 {
		color: #0369a1;
	}
	h2 {
		margin: 0 0 0.375rem;
		font-size: 1.25rem;
		line-height: 1.5;
		text-wrap: balance;
		transition: color 0.15s ease;
	}
	.excerpt {
		margin: 0 0 0.625rem;
		color: #4b5563;
		font-size: 0.9375rem;
	}
	.byline {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin: 0;
		font-size: 0.8125rem;
		color: #9ca3af;
	}
	.author {
		padding: 0.0625rem 0.625rem;
		background: #eef2f7;
		border: 1px solid #dde4ee;
		border-radius: 999px;
		color: #475569;
	}
	.cta {
		margin: 0 0 1.5rem;
		padding: 0.875rem 1.25rem;
		background: #f0f9ff;
		border: 1px dashed #7dd3fc;
		border-radius: 0.75rem;
		font-size: 0.9375rem;
	}
	.address-row {
		display: inline-flex;
		align-items: center;
		gap: 0.375rem;
		/* 行内 flex 上下会略高，压一点保持行距 */
		margin: -0.125rem 0;
		vertical-align: middle;
	}
	.address {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.875em;
	}
	.empty {
		color: #6b7280;
	}
</style>
