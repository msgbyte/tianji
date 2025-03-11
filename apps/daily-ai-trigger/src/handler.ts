import dayjs from 'dayjs';
import { openApiClient } from 'tianji-client-sdk';
import { addFeishuBitableRecord, notifyToFeishu } from './notify/feishu';

export async function handleTriggerAITask(env: Env) {
	const workspaceId = env.WORKSPACE_ID;
	const surveyId = env.SURVEY_ID;
	const payloadContentField = env.PAYLOAD_CONTENT_FIELD;

	const category = await openApiClient.SurveyService.surveyAiCategoryList({
		workspaceId,
		surveyId,
	});
	const suggestionCategory = category.map((c) => c.name).filter((n): n is string => Boolean(n));

	const startAt = dayjs().subtract(1, 'day').startOf('day').valueOf();
	const endAt = dayjs().subtract(1, 'day').endOf('day').valueOf();

	await openApiClient.AiService.aiClassifySurvey({
		requestBody: {
			workspaceId,
			surveyId,
			startAt,
			endAt,
			payloadContentField,
			suggestionCategory,
			languageStrategy: 'user',
			runStrategy: 'skipExist',
		},
	});
	await openApiClient.AiService.aiTranslateSurvey({
		requestBody: {
			workspaceId,
			surveyId,
			startAt,
			endAt,
			payloadContentField,
			languageStrategy: 'user',
			runStrategy: 'skipExist',
		},
	});

	console.log('Run aiClassifySurvey completed.');
}

export async function handleCreateDailyReport(env: Env) {
	console.log('handleCreateDailyReport');

	const workspaceId = env.WORKSPACE_ID;
	const surveyId = env.SURVEY_ID;

	const startDate = dayjs().subtract(1, 'day').startOf('day');
	const endDate = dayjs().subtract(1, 'day').endOf('day');

	const { items } = await openApiClient.SurveyService.surveyResultList({
		workspaceId,
		surveyId,
		startAt: startDate.valueOf(),
		endAt: endDate.valueOf(),
		limit: 1000,
	});

	const resultList = items.filter((item) => Boolean(item.aiCategory));

	const title = `[${startDate.format('YYYY-MM-DD HH:mm:ss')} ~ ${endDate.format('HH:mm:ss')}] Survey Daily Report`;

	let content = '';

	const categoryCount: { [category: string]: number } = {};
	resultList.forEach((record) => {
		const category = record.aiCategory || 'Uncategorized';
		categoryCount[category] = (categoryCount[category] || 0) + 1;
	});

	const sortedCategories = Object.entries(categoryCount).sort((a, b) => b[1] - a[1]);

	content += `All Categories:\n`;
	sortedCategories.forEach(([category, count]) => {
		content += `- ${category}(${count})\n`;
	});

	// 3. 获取记录数最多的前 3 个分类
	const top3Categories = sortedCategories.slice(0, 3);

	content += `\n\nTop Issues:\n`;
	top3Categories.forEach(([category, count]) => {
		// 筛选出对应分类的所有记录
		const records = resultList.filter((record) => record.aiCategory === category);
		// 抽样获取 3 条记录（如果不足 3 条则返回全部）
		const sampledRecords = sampleItems(records, 3);

		content += `- ${category} (${count})\n`;
		sampledRecords.forEach((record) => {
			content += `  - ${record.aiTranslation}\n`;
		});
	});

	await Promise.all([
		notifyToFeishu(env, title, content),
		addFeishuBitableRecord(
			env,
			items.map((item) => ({
				id: item.id,
				content: item.aiTranslation ?? '',
				category: item.aiCategory ?? '',
				createdAt: item.createdAt ?? dayjs(),
			})),
		),
	]);
}

/**
 * Randomly sample a specified number of elements from an array
 */
function sampleItems<T>(items: T[], sampleSize: number): T[] {
	const copy = [...items];
	for (let i = copy.length - 1; i > 0; i--) {
		const j = Math.floor(Math.random() * (i + 1));
		[copy[i], copy[j]] = [copy[j], copy[i]];
	}
	return copy.slice(0, sampleSize);
}
