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
import { LuCodeXml, LuCopy, LuExternalLink } from 'react-icons/lu';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { CodeBlock } from '../CodeBlock';
import {
  generateSurveyExampleCurlCode,
  generateSurveyExampleSDKCode,
} from '@/utils/survey';
import { CodeExample } from '../CodeExample';
import { toast } from 'sonner';
import { Input } from '../ui/input';
import copy from 'copy-to-clipboard';
import { useEvent } from '@/hooks/useEvent';

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

    const publicUrl = `${window.location.origin}/survey/${workspaceId}/${surveyId}/public`;

    const handleCopyUrl = useEvent(() => {
      copy(publicUrl);
      toast.success(t('URL copied to clipboard'));
    });

    const handleOpenUrl = useEvent(() => {
      window.open(publicUrl, '_blank');
    });

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" Icon={LuCodeXml}>
            {t('Usage')}
          </Button>
        </DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Survey Usage')}</DialogTitle>
            <DialogDescription>
              {t('Share the public link or integrate with code')}
            </DialogDescription>
          </DialogHeader>

          <div className="w-full space-y-6 overflow-hidden">
            {/* Public URL Section */}
            <div className="space-y-2 overflow-hidden">
              <h3 className="text-sm font-medium">{t('Public Survey Link')}</h3>
              <div className="flex gap-2 pl-1">
                <Input
                  className="font-mono text-sm"
                  value={publicUrl}
                  readOnly
                />
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleCopyUrl}
                  title={t('Copy URL')}
                >
                  <LuCopy />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleOpenUrl}
                  title={t('Open in new tab')}
                >
                  <LuExternalLink />
                </Button>
              </div>
              <p className="text-muted-foreground text-xs">
                {t(
                  'Share this link with your users to collect survey responses'
                )}
              </p>
            </div>

            {/* Code Examples Section */}
            <div className="w-full space-y-2 overflow-hidden">
              <h3 className="text-sm font-medium">
                {t('Integration Code Examples')}
              </h3>
              <CodeExample
                example={{
                  curl: {
                    label: 'curl',
                    code: generateSurveyExampleCurlCode(
                      window.location.origin,
                      info
                    ),
                  },
                  sdk: {
                    label: 'sdk',
                    element: (
                      <div className="flex flex-col gap-1">
                        <CodeBlock code="npm install tianji-client-sdk" />

                        <CodeBlock
                          code={generateSurveyExampleSDKCode(
                            window.location.origin,
                            info
                          )}
                        />
                      </div>
                    ),
                  },
                }}
              />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);
SurveyUsageBtn.displayName = 'SurveyUsageBtn';
