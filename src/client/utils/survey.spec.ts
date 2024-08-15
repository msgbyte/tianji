import { describe, test, expect } from 'vitest';
import { generateSurveyExampleCode } from './survey';

describe('survey', () => {
  test('example code', () => {
    expect(
      generateSurveyExampleCode('https://example.com', {
        id: '<surveyId>',
        workspaceId: '<workspaceId>',
        name: 'Test',
        payload: {
          items: [
            {
              name: 'textField',
              label: 'Text',
              type: 'text',
            },
          ],
        },
      })
    ).matchSnapshot();
  });
});
