import { error, fail } from '@sveltejs/kit';
import {
	listPendingLetters,
	listPendingReplies,
	listPublishedLetters,
	listPublishedRepliesJoined,
	moderateLetter,
	moderateReply
} from '$lib/server/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform) error(500, '平台不可用');
	const db = platform.env.DB;
	const [letters, replies, publishedLetters, publishedReplies] = await Promise.all([
		listPendingLetters(db),
		listPendingReplies(db),
		listPublishedLetters(db),
		listPublishedRepliesJoined(db)
	]);
	return { letters, replies, publishedLetters, publishedReplies };
};

function getId(formData: FormData): string | null {
	const id = formData.get('id');
	return typeof id === 'string' && id ? id : null;
}

/** 删除信件：连带删 R2 原件、所有回信的 R2 原件和回信行 */
async function deleteLetterDeep(env: Env, id: string): Promise<void> {
	const letter = await env.DB.prepare('SELECT r2_key FROM letters WHERE id = ?1')
		.bind(id)
		.first<{ r2_key: string }>();
	if (!letter) return;
	const replies = await env.DB.prepare('SELECT r2_key FROM replies WHERE letter_id = ?1')
		.bind(id)
		.all<{ r2_key: string }>();
	await Promise.all([letter, ...replies.results].map((row) => env.RAW_EMAILS.delete(row.r2_key)));
	await env.DB.batch([
		env.DB.prepare('DELETE FROM replies WHERE letter_id = ?1').bind(id),
		env.DB.prepare('DELETE FROM letters WHERE id = ?1').bind(id)
	]);
}

/** 删除回信：连带删 R2 原件 */
async function deleteReplyDeep(env: Env, id: string): Promise<void> {
	const reply = await env.DB.prepare('SELECT r2_key FROM replies WHERE id = ?1')
		.bind(id)
		.first<{ r2_key: string }>();
	if (!reply) return;
	await env.RAW_EMAILS.delete(reply.r2_key);
	await env.DB.prepare('DELETE FROM replies WHERE id = ?1').bind(id).run();
}

export const actions: Actions = {
	approveLetter: async ({ request, platform }) => {
		if (!platform) error(500, '平台不可用');
		const id = getId(await request.formData());
		if (!id) return fail(400, { error: 'missing id' });
		await moderateLetter(platform.env.DB, id, 'approved');
	},
	rejectLetter: async ({ request, platform }) => {
		if (!platform) error(500, '平台不可用');
		const id = getId(await request.formData());
		if (!id) return fail(400, { error: 'missing id' });
		await moderateLetter(platform.env.DB, id, 'rejected');
	},
	approveReply: async ({ request, platform }) => {
		if (!platform) error(500, '平台不可用');
		const id = getId(await request.formData());
		if (!id) return fail(400, { error: 'missing id' });
		await moderateReply(platform.env.DB, id, 'approved');
	},
	rejectReply: async ({ request, platform }) => {
		if (!platform) error(500, '平台不可用');
		const id = getId(await request.formData());
		if (!id) return fail(400, { error: 'missing id' });
		await moderateReply(platform.env.DB, id, 'rejected');
	},
	deleteLetter: async ({ request, platform }) => {
		if (!platform) error(500, '平台不可用');
		const id = getId(await request.formData());
		if (!id) return fail(400, { error: 'missing id' });
		await deleteLetterDeep(platform.env, id);
	},
	deleteReply: async ({ request, platform }) => {
		if (!platform) error(500, '平台不可用');
		const id = getId(await request.formData());
		if (!id) return fail(400, { error: 'missing id' });
		await deleteReplyDeep(platform.env, id);
	}
};
