import { AppRouterOutput } from '@/api/trpc';

/**
 * Generate survey example code
 */
export function generateSurveyExampleCode(
  host: string,
  info?: AppRouterOutput['survey']['get']
): string {
  const fields = info?.payload.items ?? [];

  const exampleCode = `import { submitSurvey, initOpenapiSDK } from 'tianji-client-sdk';

initOpenapiSDK('${host}');

/**
 * Submit Survey into ${info?.name ?? 'Tianji'}
 *
 * ${fields.map((field) => `@param {${field.type}} ${field.name} ${field.label}`).join('\n * ')}
 */
async function submitForm(${fields.map((field) => field.name).join(', ')}) {
  try {
    await submitSurvey(
      '${info?.workspaceId}',
      '${info?.id}',
      {
        ${fields.map((field) => `${field.name}, // ${field.label}`).join('\n        ')}
      }
    );
    console.log('Submit success');
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }
};`;

  return exampleCode;
}
