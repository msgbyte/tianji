import { AppInformation, AppstoreConfig, GooglePlayConfig } from './types';
import { submitSurvey, initOpenapiSDK } from 'tianji-client-sdk';

export async function postToTianji(
  review: any,
  config: GooglePlayConfig | AppstoreConfig,
  appInformation: AppInformation
) {
  initOpenapiSDK(config.tianji.baseUrl, {
    header: {
      // 'x-flow-cf-bypass': '&AB=c_ut9fRapRiqedRe',
    },
  });
  await submitSurvey(config.tianji.workspaceId, config.tianji.surveyId, {
    ...review,
    ...appInformation,
  });
}
