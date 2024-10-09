import { AppRouterOutput } from '@/api/trpc';

/**
 * Generate survey example sdk code
 */
export function generateSurveyExampleSDKCode(
  host: string,
  info:
    | Pick<
        NonNullable<AppRouterOutput['survey']['get']>,
        'id' | 'name' | 'workspaceId' | 'payload'
      >
    | null
    | undefined
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

/**
 * Generate survey example curl code
 */
export function generateSurveyExampleCurlCode(
  host: string,
  info:
    | Pick<
        NonNullable<AppRouterOutput['survey']['get']>,
        'id' | 'name' | 'workspaceId' | 'payload'
      >
    | null
    | undefined
): string {
  const fields = info?.payload.items ?? [];

  const exampleCode = `curl -X POST ${host}/open/workspace/${info?.workspaceId}/survey/${info?.id}/submit \\
  -H "Content-Type: application/json" \\
  -d '{
    "payload": {
      ${fields.map((field) => `"${field.name}": "${field.label}"`).join(',\n      ')}
    }
  }'`;

  return exampleCode;
}
