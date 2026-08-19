<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import LocalTime from '$lib/LocalTime.svelte';
	import { d1ToIso, excerpt } from '$lib/text';
	import { pseudonymFor } from '$lib/pseudonym';

	let { data } = $props();

	// 回信按时间升序，编号即楼层号；parent_reply_id 指向同列表里的楼层
	const floorOf = (replyId: string) => data.replies.findIndex((r) => r.id === replyId) + 1;

	const title = $derived(data.letter.subject || '（无主题）');
	const description = $derived(excerpt(data.letter.body_text));
	const publishedIso = $derived(d1ToIso(data.letter.published_at ?? data.letter.created_at));
	const jsonLd = $derived(
		// 把 < 转成 <，防止正文里的标签提前闭合 script 元素
		JSON.stringify({
			'@context': 'https://schema.org',
			'@type': 'Article',
			headline: title,
			datePublished: publishedIso,
			inLanguage: 'zh-CN',
			mainEntityOfPage: page.url.href,
			articleBody: data.letter.body_text
		}).replace(/</g, '\\u003c')
	);
	// script 标签在 script 块里拼好（<\/script> 防止提前闭合），避免模板解析器误判
	// eslint-disable-next-line no-useless-escape -- \/ 是给 HTML 解析器的，不是 JS 转义
	const jsonLdTag = $derived(`<script type="application/ld+json">${jsonLd}<\/script>`);
</script>

<svelte:head>
	<title>{title} · Poster 邮局</title>
	<meta name="description" content={description} />
	<meta property="og:type" content="article" />
	<meta property="og:title" content={title} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={page.url.href} />
	<meta property="article:published_time" content={publishedIso} />
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- 内容来自 JSON.stringify 且 < 已转义，安全 -->
	{@html jsonLdTag}
</svelte:head>

<article>
	<header>
		<h1>{data.letter.subject || '（无主题）'}</h1>
		<p class="meta">
			{pseudonymFor(data.letter.sender_hash)} ·
			<LocalTime time={data.letter.published_at ?? data.letter.created_at} />
			· <a href={resolve('/letters/[id]/atom.xml', { id: data.letter.id })}>订阅回信</a>
		</p>
	</header>

	<p class="body">{data.letter.body_text}</p>

	{#if data.letter.attachments.length > 0}
		<div class="attachments">
			{#each data.letter.attachments as attachment (attachment.key)}
				<img src="/attachments/{attachment.key}" alt={attachment.filename} loading="lazy" />
			{/each}
		</div>
	{/if}

	<aside class="reply-box">
		想回复这封信？发邮件到
		<a href="mailto:{data.replyAddress}">{data.replyAddress}</a>
		，通过审核后会显示在下面。
	</aside>
</article>

{#if data.replies.length > 0}
	<section class="replies">
		<h2>回信（{data.replies.length}）</h2>
		{#each data.replies as reply, i (reply.id)}
			<article class="reply" id={reply.id}>
				<p class="meta">
					#{i + 1} · {pseudonymFor(reply.sender_hash)}
					{#if reply.parent_reply_id && floorOf(reply.parent_reply_id) > 0}
						· 回复 <a href="#{reply.parent_reply_id}">#{floorOf(reply.parent_reply_id)}</a>
					{/if}
					· <LocalTime time={reply.published_at ?? reply.created_at} />
				</p>
				{#if reply.subject}
					<h3>{reply.subject}</h3>
				{/if}
				<p class="body">{reply.body_text}</p>
				{#if reply.attachments.length > 0}
					<div class="attachments">
						{#each reply.attachments as attachment (attachment.key)}
							<img src="/attachments/{attachment.key}" alt={attachment.filename} loading="lazy" />
						{/each}
					</div>
				{/if}
				{#if reply.reply_token}
					<p class="meta">
						回复这条：<a href="mailto:poster+{reply.reply_token}@driftcell.dev"
							>poster+{reply.reply_token}@driftcell.dev</a
						>
					</p>
				{/if}
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
	.attachments {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin: 0.75rem 0;
	}
	.attachments img {
		max-width: 100%;
		max-height: 24rem;
		border-radius: 0.5rem;
		border: 1px solid #e5e7eb;
		object-fit: contain;
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
