// DeepSeek 自动审核：OpenAI 兼容接口，JSON 模式输出判定
// 原则：只自动通过，永不自动拒绝；任何异常都回退人工审核

export interface ModerationVerdict {
	approve: boolean;
	reason: string;
}

const SYSTEM_PROMPT = `你是一个邮局网站的内容审核员。访客通过电子邮件投稿，审核通过的邮件会公开展示在网站上。
判断这封邮件是否适合公开展示。以下情况不予通过：垃圾广告、违法内容、人身攻击、泄露他人隐私信息、恶意链接、明显的乱码或机器批量滥发。
正常的来信、问候、文章、观点表达都应通过。
只回复 JSON：{"approve": true 或 false, "reason": "简短中文理由"}`;

// 完整信封送审，仅保留一个高水位保险丝防止病态超长邮件撑爆上下文
const MAX_BODY_CHARS = 50_000;

interface ChatCompletion {
	choices?: { message?: { content?: string } }[];
}

function fallback(reason: string): ModerationVerdict {
	return { approve: false, reason };
}

export async function autoModerate(
	apiKey: string,
	mail: { from: string; to: string; subject: string; body: string }
): Promise<ModerationVerdict> {
	try {
		const response = await fetch('https://api.deepseek.com/chat/completions', {
			method: 'POST',
			headers: {
				'content-type': 'application/json',
				authorization: `Bearer ${apiKey}`
			},
			body: JSON.stringify({
				model: 'deepseek-v4-flash',
				messages: [
					{ role: 'system', content: SYSTEM_PROMPT },
					{
						role: 'user',
						content: `发件人：${mail.from}\n收件人：${mail.to}\n主题：${mail.subject}\n\n正文：\n${mail.body.slice(0, MAX_BODY_CHARS)}`
					}
				],
				response_format: { type: 'json_object' },
				temperature: 0
			}),
			signal: AbortSignal.timeout(15_000)
		});
		if (!response.ok) {
			console.error(`moderation api error: ${response.status}`);
			return fallback('审核服务异常，转人工');
		}

		const data: ChatCompletion = await response.json();
		const content = data.choices?.[0]?.message?.content;
		if (!content) return fallback('审核服务无返回，转人工');

		const verdict: unknown = JSON.parse(content);
		if (typeof verdict !== 'object' || verdict === null || !('approve' in verdict)) {
			return fallback('审核返回格式异常，转人工');
		}
		const { approve } = verdict as { approve: unknown };
		const reason =
			'reason' in verdict && typeof verdict.reason === 'string' ? verdict.reason.slice(0, 200) : '';
		return { approve: approve === true, reason };
	} catch (error) {
		console.error('moderation failed', error);
		return fallback('审核服务异常，转人工');
	}
}
