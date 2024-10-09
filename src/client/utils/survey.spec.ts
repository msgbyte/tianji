import { describe, test, expect } from 'vitest';
import {
  generateSurveyExampleCurlCode,
  generateSurveyExampleSDKCode,
} from './survey';

describe('survey', () => {
  test('example sdk code', () => {
    expect(
      generateSurveyExampleSDKCode('https://example.com', {
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

  test('example curl code', () => {
    expect(
      generateSurveyExampleCurlCode('https://example.com', {
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
