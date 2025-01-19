// @ts-ignore
import { FunctionDefinition } from 'openai/resources/shared.mjs';

export type PromptToolDefinition = FunctionDefinition;

export const openAITools = {
  getSurveyByDateRange: {
    name: 'getSurveyByDateRange',
    description: 'Get Survey record by date range.',
    parameters: {
      type: 'object',
      properties: {
        startAt: {
          type: 'string',
          description: "Date format, such as 'YYYY-MM-DDTHH:mm:ssZ' or 'ISO'",
        },
        endAt: {
          type: 'string',
          description:
            "Date format, such as 'YYYY-MM-DDTHH:mm:ssZ' or 'ISO', default should be now.",
        },
      },
      required: ['startAt', 'endAt'],
    },
  },
} satisfies Record<string, FunctionDefinition>;
