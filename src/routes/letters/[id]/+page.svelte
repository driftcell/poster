<script lang="ts">
	import { resolve } from '$app/paths';
	import LocalTime from '$lib/LocalTime.svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.letter.subject || '（无主题）'} · Poster 邮局</title>
</svelte:head>

<article>
	<header>
		<h1>{data.letter.subject || '（无主题）'}</h1>
		<p class="meta">
			<LocalTime time={data.letter.published_at ?? data.letter.created_at} />
			· <a href={resolve('/letters/[id]/atom.xml', { id: data.letter.id })}>订阅回信</a>
		</p>
	</header>

	<p class="body">{data.letter.body_text}</p>

	<aside class="reply-box">
		想回复这封信？发邮件到
		<a href="mailto:{data.replyAddress}">{data.replyAddress}</a>
		，通过审核后会显示在下面。
	</aside>
</article>

{#if data.replies.length > 0}
	<section class="replies">
		<h2>回信（{data.replies.length}）</h2>
		{#each data.replies as reply (reply.id)}
			<article class="reply">
				{#if reply.subject}
					<h3>{reply.subject}</h3>
				{/if}
				<p class="body">{reply.body_text}</p>
				<LocalTime time={reply.published_at ?? reply.created_at} />
			</article>
		{/each}
	</section>
{/if}

<style>
	h1 {
		margin: 0 0 0.25rem;
		font-size: 1.5rem;
	}
	.meta {
		margin: 0 0 1.5rem;
		font-size: 0.875rem;
		color: #9ca3af;
	}
	.body {
		white-space: pre-wrap;
		word-break: break-word;
	}
	.reply-box {
		margin: 2rem 0;
		padding: 1rem;
		background: #f0f9ff;
		border: 1px solid #bae6fd;
		border-radius: 0.5rem;
		font-size: 0.9375rem;
	}
	.replies {
		margin-top: 2rem;
	}
	.reply {
		padding: 1rem 0;
		border-top: 1px solid #e5e7eb;
	}
	.reply h3 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
	}
	.reply :global(time) {
		font-size: 0.875rem;
		color: #9ca3af;
	}
</style>
