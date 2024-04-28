import { SurveyService } from './open/client';

export async function getSurveyInfo(workspaceId: string, surveyId: string) {
  const survey = await SurveyService.surveyGet({
    workspaceId,
    surveyId,
  });

  return survey;
}

export async function submitSurvey(
  workspaceId: string,
  surveyId: string,
  payload: Record<string, any>
) {
  const res = await SurveyService.surveySubmit({
    workspaceId,
    surveyId,
    requestBody: {
      payload,
    },
  });

  return res;
}
