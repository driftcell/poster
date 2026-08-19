<script lang="ts">
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
				<time>{letter.created_at}</time>
			</header>
			<p class="meta">发件人哈希 <code>{shortHash(letter.sender_hash)}</code></p>
			<p class="body">{letter.body_text}</p>
			<form method="POST">
				<input type="hidden" name="id" value={letter.id} />
				<button type="submit" class="approve" formaction="?/approveLetter">通过</button>
				<button type="submit" class="reject" formaction="?/rejectLetter">拒绝</button>
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
				<time>{reply.created_at}</time>
			</header>
			<p class="meta">
				回复「{reply.letter_subject || '（无主题）'}」 · 发件人哈希
				<code>{shortHash(reply.sender_hash)}</code>
			</p>
			<p class="body">{reply.body_text}</p>
			<form method="POST">
				<input type="hidden" name="id" value={reply.id} />
				<button type="submit" class="approve" formaction="?/approveReply">通过</button>
				<button type="submit" class="reject" formaction="?/rejectReply">拒绝</button>
			</form>
		</article>
	{:else}
		<p class="empty">没有待审核的回信。</p>
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
	.card header {
		display: flex;
		justify-content: space-between;
		align-items: baseline;
		gap: 1rem;
	}
	.card h3 {
		margin: 0;
		font-size: 1rem;
	}
	.card time {
		font-size: 0.8125rem;
		color: #9ca3af;
		white-space: nowrap;
	}
	.meta {
		margin: 0.25rem 0;
		font-size: 0.8125rem;
		color: #6b7280;
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
		background: #dc2626;
		color: #fff;
	}
	.empty {
		color: #9ca3af;
	}
</style>
