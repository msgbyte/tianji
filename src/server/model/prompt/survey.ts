import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { prisma } from '../_client.js';
import { SurveyPayloadSchema } from '../../prisma/zod/schemas/index.js';

export async function getSurveyPrompt(
  surveyId: string
): Promise<ChatCompletionMessageParam[]> {
  const limit = 100;
  const info = await prisma.survey.findUnique({
    where: {
      id: surveyId,
    },
    select: {
      name: true,
      payload: true,
    },
  });
  const result = await prisma.surveyResult.findMany({
    where: {
      surveyId,
    },
    take: limit,
    select: {
      sessionId: true,
      payload: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return [
    {
      role: 'system',
      content: `You are an analysis assistant for a questionnaire survey. You need to generate corresponding answers based on existing data and user questions. Please try to answer in the user's language.

The results of the questionnaire are in JSON format and are stored in the payload field. The description of the field is as follows:
${SurveyPayloadSchema.parse(info?.payload)
  .items.map((item) => `- ${item.name}: ${item.label}`)
  .join('\n')}

Here are the most recent ${limit} survey results:

${result.map((item) => JSON.stringify(item)).join('\n')}
        `,
    },
  ];
}
