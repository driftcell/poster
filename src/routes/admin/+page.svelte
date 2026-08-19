<script lang="ts">
	import LocalTime from '$lib/LocalTime.svelte';

	let { data } = $props();

	const shortHash = (hash: string) => hash.slice(0, 12);
</script>

<svelte:head>
	<title>审核 · Poster 邮局</title>
</svelte:head>

<h1>待审核</h1>

<section>
	<h2>信件（{data.letters.length}）</h2>
	{#each data.letters as letter (letter.id)}
		<article class="card">
			<header>
				<h3>{letter.subject || '（无主题）'}</h3>
				<LocalTime time={letter.created_at} />
			</header>
			<p class="meta">发件人哈希 <code>{shortHash(letter.sender_hash)}</code></p>
			{#if letter.review_note}
				<p class="note">AI 审核：{letter.review_note}</p>
			{/if}
			<p class="body">{letter.body_text}</p>
			<form method="POST">
				<input type="hidden" name="id" value={letter.id} />
				<button type="submit" class="approve" formaction="?/approveLetter">通过</button>
				<button type="submit" class="reject" formaction="?/rejectLetter">拒绝</button>
				<button type="submit" class="delete" formaction="?/deleteLetter">删除</button>
			</form>
		</article>
	{:else}
		<p class="empty">没有待审核的信件。</p>
	{/each}
</section>

<section>
	<h2>回信（{data.replies.length}）</h2>
	{#each data.replies as reply (reply.id)}
		<article class="card">
			<header>
				<h3>{reply.subject || '（无主题）'}</h3>
				<LocalTime time={reply.created_at} />
			</header>
			<p class="meta">
				回复「{reply.letter_subject || '（无主题）'}」 · 发件人哈希
				<code>{shortHash(reply.sender_hash)}</code>
			</p>
			{#if reply.review_note}
				<p class="note">AI 审核：{reply.review_note}</p>
			{/if}
			<p class="body">{reply.body_text}</p>
			<form method="POST">
				<input type="hidden" name="id" value={reply.id} />
				<button type="submit" class="approve" formaction="?/approveReply">通过</button>
				<button type="submit" class="reject" formaction="?/rejectReply">拒绝</button>
				<button type="submit" class="delete" formaction="?/deleteReply">删除</button>
			</form>
		</article>
	{:else}
		<p class="empty">没有待审核的回信。</p>
	{/each}
</section>

<h1>已发布</h1>

<section>
	<h2>信件（{data.publishedLetters.length}）</h2>
	{#each data.publishedLetters as letter (letter.id)}
		<article class="card row">
			<h3>{letter.subject || '（无主题）'}</h3>
			{#if letter.review_note}
				<p class="meta">自动通过 · {letter.review_note}</p>
			{/if}
			<LocalTime time={letter.published_at ?? letter.created_at} />
			<form method="POST">
				<input type="hidden" name="id" value={letter.id} />
				<button type="submit" class="delete" formaction="?/deleteLetter">删除</button>
			</form>
		</article>
	{:else}
		<p class="empty">没有已发布的信件。</p>
	{/each}
</section>

<section>
	<h2>回信（{data.publishedReplies.length}）</h2>
	{#each data.publishedReplies as reply (reply.id)}
		<article class="card row">
			<h3>{reply.subject || '（无主题）'}</h3>
			<p class="meta">
				回复「{reply.letter_subject || '（无主题）'}」{#if reply.review_note}
					· 自动通过 · {reply.review_note}{/if}
			</p>
			<LocalTime time={reply.published_at ?? reply.created_at} />
			<form method="POST">
				<input type="hidden" name="id" value={reply.id} />
				<button type="submit" class="delete" formaction="?/deleteReply">删除</button>
			</form>
		</article>
	{:else}
		<p class="empty">没有已发布的回信。</p>
	{/each}
</section>

<style>
	h1 {
		font-size: 1.5rem;
	}
	h2 {
		font-size: 1.1rem;
		color: #6b7280;
	}
	.card {
		margin: 0 0 1rem;
		padding: 1rem;
		border: 1px solid #e5e7eb;
		border-radius: 0.5rem;
	}
	.card header,
	.card.row {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
	}
	.card h3 {
		margin: 0;
		font-size: 1rem;
	}
	.card :global(time) {
		font-size: 0.8125rem;
		color: #9ca3af;
		white-space: nowrap;
	}
	.meta {
		margin: 0.25rem 0;
		font-size: 0.8125rem;
		color: #6b7280;
	}
	.note {
		margin: 0.25rem 0;
		font-size: 0.8125rem;
		color: #b45309;
	}
	.body {
		white-space: pre-wrap;
		word-break: break-word;
		margin: 0.75rem 0;
	}
	form {
		display: flex;
		gap: 0.5rem;
	}
	button {
		padding: 0.375rem 1rem;
		border: none;
		border-radius: 0.375rem;
		cursor: pointer;
		font-size: 0.875rem;
	}
	.approve {
		background: #16a34a;
		color: #fff;
	}
	.reject {
		background: #f59e0b;
		color: #fff;
	}
	.delete {
		background: #dc2626;
		color: #fff;
	}
	.empty {
		color: #9ca3af;
	}
</style>
