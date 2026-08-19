<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import CopyButton from '$lib/CopyButton.svelte';
	import LocalTime from '$lib/LocalTime.svelte';
	import { d1ToIso, excerpt } from '$lib/text';
	import { pseudonymFor } from '$lib/pseudonym';

	let { data } = $props();

	// 回信按时间升序，编号即楼层号；parent_reply_id 指向同列表里的楼层
	const floorOf = (replyId: string) => data.replies.findIndex((r) => r.id === replyId) + 1;

	/** 空行分段；段内的单个换行交给 CSS pre-line 渲染为换行 */
	const paragraphs = (text: string) => text.split(/\n{2,}/).filter((p) => p.trim());

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
	<link
		rel="alternate"
		type="application/atom+xml"
		title={`回信 · ${title}`}
		href={resolve('/letters/[id]/atom.xml', { id: data.letter.id })}
	/>
	<!-- eslint-disable-next-line svelte/no-at-html-tags -- 内容来自 JSON.stringify 且 < 已转义，安全 -->
	{@html jsonLdTag}
</svelte:head>

<article class="letter">
	<header>
		<h1>{data.letter.subject || '（无主题）'}</h1>
		<p class="meta">
			<span class="author">{pseudonymFor(data.letter.sender_hash)}</span>
			<LocalTime time={data.letter.published_at ?? data.letter.created_at} seconds={false} />
			· <a href={resolve('/letters/[id]/atom.xml', { id: data.letter.id })}>订阅回信</a>
		</p>
	</header>

	<div class="body">
		{#each paragraphs(data.letter.body_text) as paragraph, i (i)}
			<p>{paragraph}</p>
		{/each}
	</div>

	{#if data.letter.attachments.length > 0}
		<div class="attachments">
			{#each data.letter.attachments as attachment (attachment.key)}
				<img src="/attachments/{attachment.key}" alt={attachment.filename} loading="lazy" />
			{/each}
		</div>
	{/if}
</article>

<details class="reply-box">
	<summary>回复这封信</summary>
	<div class="reply-content">
		<p>发邮件到这个地址，回信会显示在本页：</p>
		<p class="address-row">
			<a class="address" href="mailto:{data.replyAddress}">{data.replyAddress}</a><CopyButton
				text={data.replyAddress}
			/>
		</p>
	</div>
</details>

{#if data.replies.length > 0}
	<section class="replies">
		<h2>回信（{data.replies.length}）</h2>
		{#each data.replies as reply, i (reply.id)}
			<article class="reply" id={reply.id}>
				<p class="meta">
					<span class="floor">#{i + 1}</span>
					<span class="author">{pseudonymFor(reply.sender_hash)}</span>
					{#if reply.parent_reply_id && floorOf(reply.parent_reply_id) > 0}
						<a class="quote" href="#{reply.parent_reply_id}"
							>回复 #{floorOf(reply.parent_reply_id)}</a
						>
					{/if}
					<LocalTime time={reply.published_at ?? reply.created_at} seconds={false} />
				</p>
				{#if reply.subject}
					<h3>{reply.subject}</h3>
				{/if}
				<div class="body">
					{#each paragraphs(reply.body_text) as paragraph, j (j)}
						<p>{paragraph}</p>
					{/each}
				</div>
				{#if reply.attachments.length > 0}
					<div class="attachments">
						{#each reply.attachments as attachment (attachment.key)}
							<img src="/attachments/{attachment.key}" alt={attachment.filename} loading="lazy" />
						{/each}
					</div>
				{/if}
				{#if reply.reply_token}
					<p class="meta reply-via">
						回复这条：<a href="mailto:poster+{reply.reply_token}@driftcell.dev"
							>poster+{reply.reply_token}@driftcell.dev</a
						><CopyButton text="poster+{reply.reply_token}@driftcell.dev" />
					</p>
				{/if}
			</article>
		{/each}
	</section>
{/if}

<style>
	.letter {
		background: #fffdf8;
		border: 1px solid #e9e5da;
		border-radius: 0.75rem;
		padding: 2rem 2rem 1.5rem;
		box-shadow: 0 1px 3px rgb(0 0 0 / 0.06);
	}
	h1 {
		margin: 0 0 0.75rem;
		font-size: 1.5rem;
		line-height: 1.4;
		text-wrap: balance;
	}
	.meta {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem 0.5rem;
		margin: 0 0 1.75rem;
		padding-bottom: 1rem;
		border-bottom: 1px dashed #e9e5da;
		font-size: 0.875rem;
		color: #9ca3af;
	}
	.author {
		display: inline-block;
		padding: 0.125rem 0.625rem;
		background: #eef2f7;
		border: 1px solid #dde4ee;
		border-radius: 999px;
		font-size: 0.8125rem;
		color: #475569;
	}
	.body p {
		margin: 0 0 1.25em;
		white-space: pre-line;
		word-break: break-word;
	}
	.body p:last-child {
		margin-bottom: 0;
	}
	.attachments {
		display: flex;
		flex-wrap: wrap;
		gap: 0.75rem;
		margin: 1.25rem 0 0.5rem;
	}
	.attachments img {
		max-width: 100%;
		max-height: 24rem;
		border-radius: 0.5rem;
		border: 1px solid #e9e5da;
		object-fit: contain;
	}
	.reply-box {
		margin: 1.5rem 0 2rem;
		background: #f0f9ff;
		border: 1px dashed #7dd3fc;
		border-radius: 0.75rem;
		font-size: 0.9375rem;
	}
	.reply-box summary {
		list-style: none;
		padding: 0.75rem 1.25rem;
		cursor: pointer;
		text-align: center;
		color: #0369a1;
		border-radius: 0.75rem;
		user-select: none;
		transition: background-color 0.15s ease;
	}
	.reply-box summary::-webkit-details-marker {
		display: none;
	}
	.reply-box summary::after {
		content: '';
		display: inline-block;
		margin-left: 0.375rem;
		width: 0.45em;
		height: 0.45em;
		border-right: 1.5px solid currentColor;
		border-bottom: 1.5px solid currentColor;
		transform: rotate(45deg) translateY(-0.125em);
		transition: transform 0.15s ease;
	}
	.reply-box[open] summary::after {
		transform: rotate(225deg) translateY(-0.05em);
	}
	.reply-box summary:hover {
		background: #e0f2fe;
	}
	.reply-box[open] summary {
		border-bottom: 1px dashed #bae6fd;
		border-radius: 0.75rem 0.75rem 0 0;
	}
	.reply-content {
		padding: 0.875rem 1.25rem;
	}
	.reply-content p {
		margin: 0 0 0.5rem;
	}
	.reply-content p:last-child {
		margin-bottom: 0;
	}
	.address-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.5rem;
	}
	.address {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.875em;
		word-break: break-all;
	}
	.reply-via {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.375rem;
		margin: 0.75rem 0 0;
		font-size: 0.8125rem;
	}
	.reply-via a {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		word-break: break-all;
	}
	.replies h2 {
		margin: 0 0 0.5rem;
		font-size: 1.125rem;
	}
	.reply {
		padding: 1.25rem 0;
		border-top: 1px solid #e5e2dc;
	}
	.reply .meta {
		margin: 0 0 0.75rem;
		padding-bottom: 0;
		border-bottom: none;
	}
	.floor {
		font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #0369a1;
	}
	.quote {
		padding: 0 0.5rem;
		background: #f0f9ff;
		border-radius: 999px;
		font-size: 0.8125rem;
		text-decoration: none;
	}
	.quote:hover {
		background: #e0f2fe;
	}
	.reply h3 {
		margin: 0 0 0.5rem;
		font-size: 1rem;
	}
	.reply .body p {
		margin-bottom: 1em;
	}
	@media (max-width: 36rem) {
		.letter {
			padding: 1.25rem 1.25rem 1rem;
			border-radius: 0.5rem;
		}
	}
</style>
