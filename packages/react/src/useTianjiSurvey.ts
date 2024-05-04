import { useState, useEffect } from 'react';
import {
  initOpenapiSDK,
  getSurveyInfo,
  openApiClient,
} from 'tianji-client-sdk';

type SurveyInfo =
  openApiClient.$OpenApiTs['/workspace/{workspaceId}/survey/{surveyId}']['get']['res']['200'];

interface UseTianjiSurveyOptions {
  baseUrl?: string;
  workspaceId: string;
  surveyId: string;
}
export function useTianjiSurvey(options: UseTianjiSurveyOptions) {
  const [isLoading, setIsLoading] = useState(false);
  const [info, setInfo] = useState<SurveyInfo | undefined>(undefined);

  useEffect(() => {
    if (options.baseUrl) {
      initOpenapiSDK(options.baseUrl);
    }
  }, [options.baseUrl]);

  useEffect(() => {
    setIsLoading(true);
    getSurveyInfo(options.workspaceId, options.surveyId)
      .then((data) => {
        setInfo(data);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [options.workspaceId, options.surveyId]);

  return { isLoading, info };
}
