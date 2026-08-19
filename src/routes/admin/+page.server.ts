import { error, fail } from '@sveltejs/kit';
import {
	listPendingLetters,
	listPendingReplies,
	moderateLetter,
	moderateReply
} from '$lib/server/db';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ platform }) => {
	if (!platform) error(500, '平台不可用');
	const db = platform.env.DB;
	const [letters, replies] = await Promise.all([listPendingLetters(db), listPendingReplies(db)]);
	return { letters, replies };
};

function getId(formData: FormData): string | null {
	const id = formData.get('id');
	return typeof id === 'string' && id ? id : null;
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
	}
};
