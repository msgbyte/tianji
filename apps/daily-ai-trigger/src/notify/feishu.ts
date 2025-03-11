import dayjs from 'dayjs';

export async function notifyToFeishu(env: Env, title: string, content: string) {
	const feishuWebhook = env.FEISHU_WEBHOOK;

	if (!feishuWebhook) {
		return;
	}

	await sendRequestToFeishu(feishuWebhook, {
		msg_type: 'interactive',
		card: {
			elements: [
				{
					tag: 'markdown',
					content,
				},
			],
			header: {
				title: {
					content: title,
					tag: 'plain_text',
				},
				template: 'yellow',
				text_tag_list: [
					{
						tag: 'text_tag',
						text: {
							tag: 'plain_text',
							content: 'Tianji Agent',
						},
						color: 'neutral',
					},
				],
			},
		},
	});
}

/**
 * Reference: https://open.feishu.cn/document/uAjLw4CM/ukzMukzMukzM/feishu-cards/card-components/content-components/title
 */
async function sendRequestToFeishu(feishuWebhook: string, body: any) {
	await fetch(feishuWebhook, {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
		},
		body: JSON.stringify(body),
	});
}

/**
 * https://open.feishu.cn/document/server-docs/authentication-management/access-token/tenant_access_token_internal
 */
async function getFeishuTenantAccessToken(env: Env) {
	const res = await fetch('https://open.feishu.cn/open-apis/auth/v3/tenant_access_token/internal', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json; charset=utf-8',
		},
		body: JSON.stringify({
			app_id: env.FEISHU_APP_ID,
			app_secret: env.FEISHU_APP_SECRET,
		}),
	}).then((res) => res.json<any>());

	if (!res.tenant_access_token) {
		throw new Error('Get tenant access token failed');
	}

	const token = res.tenant_access_token;

	return token;
}

export async function addFeishuBitableRecord(env: Env, records: { id: string; content: string; category: string; createdAt: string }[]) {
	if (!env.FEISHU_TABLE_APPTOKEN || !env.FEISHU_TABLE_ID) {
		return;
	}

	const token = await getFeishuTenantAccessToken(env);
	await fetch(
		`https://open.feishu.cn/open-apis/bitable/v1/apps/${env.FEISHU_TABLE_APPTOKEN}/tables/${env.FEISHU_TABLE_ID}/records/batch_create`,
		{
			headers: {
				'Content-Type': 'application/json; charset=utf-8',
				Authorization: `Bearer ${token}`,
			},
			method: 'POST',
			body: JSON.stringify({
				records: records.map((r) => ({
					fields: {
						id: r.id,
						content: r.content,
						category: r.category,
						createdAt: dayjs(r.createdAt).valueOf(),
					},
				})),
			}),
		},
	);
}
