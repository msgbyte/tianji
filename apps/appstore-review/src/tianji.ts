import { AppInformation, AppstoreConfig, GooglePlayConfig } from './types';
import { submitSurvey, initOpenapiSDK } from 'tianji-client-sdk';

export async function postToTianji(
  review: any,
  config: GooglePlayConfig | AppstoreConfig,
  appInformation: AppInformation
) {
  initOpenapiSDK(config.tianji.baseUrl);

  const payload = {
    ...review,
    ...appInformation,
  };

  console.log('Report to tianji:', payload);
  await submitSurvey(
    config.tianji.workspaceId,
    config.tianji.surveyId,
    payload
  );
}
