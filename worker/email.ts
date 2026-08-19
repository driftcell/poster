import { routeRecipient, type IngestMessage } from './lib';

// Cloudflare Email Routing 的入站上限约 25MB，提前拒绝避免读爆内存
const MAX_EMAIL_BYTES = 25 * 1024 * 1024;

/**
 * email 事件没有自动重试，handler 里只做最少的事：
 * 原始邮件存 R2，元数据投 Queue。出错时 setReject 让发件方收到退信，
 * 而不是静默丢失。
 */
export const handleEmail: EmailExportedHandler<Env> = async (message, env) => {
	const route = routeRecipient(message.to);
	if (!route) {
		message.setReject(`unknown recipient: ${message.to}`);
		return;
	}
	if (message.rawSize > MAX_EMAIL_BYTES) {
		message.setReject('message too large');
		return;
	}

	try {
		const raw = await new Response(message.raw).arrayBuffer();
		const now = new Date();
		const r2Key = `raw/${now.toISOString().slice(0, 10)}/${crypto.randomUUID()}.eml`;
		await env.RAW_EMAILS.put(r2Key, raw, {
			customMetadata: { from: message.from, to: message.to }
		});

		const payload: IngestMessage = {
			r2Key,
			from: message.from,
			to: message.to,
			route,
			receivedAt: now.toISOString()
		};
		await env.EMAIL_QUEUE.send(payload);
	} catch (error) {
		console.error('failed to ingest email', error);
		message.setReject('temporary failure, please try again later');
	}
};
