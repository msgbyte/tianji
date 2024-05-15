import React from 'react';
import {
  DialogHeader,
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@i18next-toolkit/react';
import { LuCode2 } from 'react-icons/lu';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { CodeBlock } from '../CodeBlock';
import { generateSurveyExampleCode } from '@/utils/survey';

interface SurveyUsageBtnProps {
  surveyId: string;
}
export const SurveyUsageBtn: React.FC<SurveyUsageBtnProps> = React.memo(
  (props) => {
    const { surveyId } = props;
    const workspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation();

    const { data: info } = trpc.survey.get.useQuery({
      workspaceId,
      surveyId,
    });

    const exampleCode = generateSurveyExampleCode(window.location.origin, info);

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" Icon={LuCode2}>
            {t('Usage')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Example code')}</DialogTitle>
            <DialogDescription>
              {t('Add this example code into your project')}
            </DialogDescription>
          </DialogHeader>

          <CodeBlock code="npm install tianji-client-sdk" />

          <CodeBlock code={exampleCode} />
        </DialogContent>
      </Dialog>
    );
  }
);
SurveyUsageBtn.displayName = 'SurveyUsageBtn';
