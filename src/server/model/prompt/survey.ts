// @ts-ignore
import type { ChatCompletionMessageParam } from 'openai/resources/index.mjs';
import { prisma } from '../_client.js';
import { SurveyPayloadSchema } from '../../prisma/zod/schemas/index.js';
import { z } from 'zod';

export const classifySurveyInputSchema = z.object({
  surveyId: z.string(),
  startAt: z.number(),
  endAt: z.number(),
  runStrategy: z.enum(['skipExist', 'skipInSuggest', 'rebuildAll']),
  languageStrategy: z.enum(['default', 'user']).default('default'),
  payloadContentField: z.string(),
  suggestionCategory: z.array(z.string()),
});

export const classifySurveyMQSchema = classifySurveyInputSchema.merge(
  z.object({
    workspaceId: z.string(),
    language: z.string(),
  })
);

export const translateSurveyInputSchema = z.object({
  surveyId: z.string(),
  startAt: z.number(),
  endAt: z.number(),
  runStrategy: z.enum(['skipExist', 'rebuildAll']),
  languageStrategy: z.enum(['default', 'user']).default('user'),
  payloadContentField: z.string(),
});

export const translateSurveyMQSchema = translateSurveyInputSchema.merge(
  z.object({
    workspaceId: z.string(),
    language: z.string(),
  })
);

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

export const basicSurveyClassifyPromptToken = 465;

export function buildSurveyClassifyPrompt(
  data: {
    id: string;
    content: any;
  }[],
  suggestionCategory: string[],
  language: string = 'en'
) {
  return {
    prompt: `
## Role

You are a content analysis expert. You will receive a list of content from various countries in JSON format. Your job is to analyze these items and provide a classification for each record.

## Skills

- **Multilingual Proficiency**: Able to understand content in different languages.
- **Semantic Understanding**: Capable of interpreting the meaning behind the text.
- **Content Summarization & Organization**: Skilled in extracting key points and structuring them.
- **Structured Output Production**: Able to present findings in a clear, organized format.

## Action

1. Read the user's input, which is a JSON array of objects. Each object contains:
   - \`id\`: a unique identifier
   - \`content\`: text in one or more languages
2. Determine the best-fit category for each \`content\` from the list below.
3. Return a JSON object where each key is the \`id\` and the value is the chosen category.

## Example

### Input Example
\`\`\`
- {"id": "id1", "content": "This option dont appear i cant use it"}
- {"id": "id2", "content": "Toda vez que tento fazer uma persona acaba que o aplicativo saí, impossibilitado de fazer uma persona"}
\`\`\`

### Output Example

\`\`\`json
{
  "id1": "Application malfunction",
  "id2": "Application crash"
}
\`\`\`

## Reference Categories

${JSON.stringify(suggestionCategory)}


## Constraints

1. **Output Format**: All responses must be returned in JSON format.
2. **Do not create new categories**: If you introduce a new category, ensure it is strictly necessary to capture the main intent of the content. If content seems to fall between two categories, pick the one that is the closest match rather than creating a new category.
3. **Key-Value Structure**: The output must be a JSON object where each \`id\` serves as the key and its corresponding classification is the value.
4. **Consistency in Data Count**: The number of entries in your output must match the number of entries in the input.
5. **Use Existing Categories**: Only create new categories if absolutely necessary.
6. **Return user perfer language**: response result should use **${language}** as response language.

`.trim(),
    question: data.map((obj) => `- ${JSON.stringify(obj)}`).join('\n'),
  };
}

export function buildSurveyTranslationPrompt(
  data: {
    id: string;
    content: any;
  }[],
  language: string = 'en'
) {
  const prompt = `
You are a translator expert.

Please help me translate those file to '${language}', direct give me json format response, strictly follow the following format and only output the following content, no other information. The NSFW format is not suitable for reading. If you need to wrap a line, you must use \n to indicate it. Do not split complete words when wrapping a line, if you need type " in a string, you must use \\"
`.trim();

  return {
    prompt,
    question: JSON.stringify(
      data.reduce((prev, curr) => {
        return {
          ...prev,
          [curr.id]: curr.content.replace(/"/g, "'"), // replace user input double quotes to single quotes to avoid json parse error
        };
      }, {})
    ),
  };
}
