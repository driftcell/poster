<script lang="ts">
	import LocalTime from '$lib/LocalTime.svelte';
	import { pseudonymFor } from '$lib/pseudonym';

	let { data } = $props();

	/** 字数 / 附件数统计，都没有时不展示 */
	const statsOf = (item: { bodyLength: number; attachmentCount: number }) => {
		const parts: string[] = [];
		if (item.bodyLength > 0) parts.push(`正文 ${item.bodyLength} 字`);
		if (item.attachmentCount > 0) parts.push(`${item.attachmentCount} 张图片`);
		return parts.join(' · ');
	};
</script>

<svelte:head>
	<title>待审核 · Poster 邮局</title>
	<meta name="robots" content="noindex" />
	<meta
		name="description"
		content="正在排队等待审核的来信与回信，通过后会在 Poster 邮局完整公开。"
	/>
</svelte:head>

<aside class="notice">
	这些邮件正在排队等待审核，通过后会完整公开。未经审核的内容尚未甄别，标题与正文以 █
	遮蔽，只保留形状和字数。
</aside>

<section>
	<h1>待审信件（{data.letters.length}）</h1>
	{#each data.letters as letter (letter.id)}
		{@const stats = statsOf(letter)}
		<article class="item">
			<h2>{letter.subject || '（无主题）'}</h2>
			{#if letter.body}
				<!-- 打码文本只传达形状，读屏直接跳过，字数见下方统计 -->
				<p class="body" aria-hidden="true">{letter.body}</p>
			{/if}
			<p class="byline">
				<span class="author">{pseudonymFor(letter.senderHash)}</span>
				<LocalTime time={letter.createdAt} seconds={false} />
				{#if stats}
					<span class="stats">{stats}</span>
				{/if}
			</p>
		</article>
	{:else}
		<p class="empty">没有待审核的信件。</p>
	{/each}
</section>

<section>
	<h1>待审回信（{data.replies.length}）</h1>
	{#each data.replies as reply (reply.id)}
		{@const stats = statsOf(reply)}
		<article class="item">
			<p class="context">回复「{reply.letterSubject || '（无主题）'}」</p>
			{#if reply.subject}
				<h2>{reply.subject}</h2>
			{/if}
			{#if reply.body}
				<p class="body" aria-hidden="true">{reply.body}</p>
			{/if}
			<p class="byline">
				<span class="author">{pseudonymFor(reply.senderHash)}</span>
				<LocalTime time={reply.createdAt} seconds={false} />
				{#if stats}
					<span class="stats">{stats}</span>
				{/if}
			</p>
		</article>
	{:else}
		<p class="empty">没有待审核的回信。</p>
	{/each}
</section>

<style>
	.notice {
		margin: 0 0 1.5rem;
		padding: 0.875rem 1.25rem;
		background: #fffbeb;
		border: 1px dashed #fcd34d;
		border-radius: 0.75rem;
		font-size: 0.9375rem;
		color: #78350f;
	}
	section + section {
		margin-top: 2rem;
	}
	h1 {
		margin: 0 0 0.75rem;
		font-size: 1.125rem;
		color: #6b7280;
	}
	.item {
		margin: 0 0 1rem;
		padding: 1rem 1.25rem;
		background: #fff;
		border: 1px solid #e5e2dc;
		border-radius: 0.75rem;
	}
	h2 {
		margin: 0;
		font-size: 1rem;
		line-height: 1.5;
		word-break: break-word;
	}
	.context {
		margin: 0 0 0.375rem;
		font-size: 0.8125rem;
		color: #6b7280;
	}
	.body {
		margin: 0.5rem 0 0;
		white-space: pre-wrap;
		word-break: break-word;
		line-height: 1.7;
		color: #4b5563;
	}
	.byline {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem 0.5rem;
		margin: 0.75rem 0 0;
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
	.empty {
		color: #9ca3af;
	}
</style>
