import React from 'react';
import { LuGithub, LuPlug, LuTestTube2 } from 'react-icons/lu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { CodeBlock } from '../CodeBlock';
import { useTranslation } from '@i18next-toolkit/react';
import { SiSentry } from 'react-icons/si';

export const FeedIntegration: React.FC<{
  feedId: string;
}> = React.memo((props) => {
  const { t } = useTranslation();

  return (
    <div className="flex flex-wrap justify-center gap-2 p-2">
      <FeedIntegrationItem
        icon={<LuGithub size={32} />}
        label="Github"
        content={
          <div>
            <div className="text-lg font-bold">{t('Receive Webhooks')}</div>

            <div>{t('Add github webhook with url')}:</div>

            <CodeBlock
              code={`${window.location.origin}/open/feed/${props.feedId}/github`}
            />

            <div>{t('Dont remember send data with application/json')}</div>
          </div>
        }
      />

      <FeedIntegrationItem
        icon={<SiSentry size={32} />}
        label="Sentry"
        content={
          <div>
            <div className="text-lg font-bold">{t('Receive Webhooks')}</div>

            <div>{t('Add sentry webhook with url')}:</div>

            <CodeBlock
              code={`${window.location.origin}/open/feed/${props.feedId}/sentry`}
            />

            <div className="mt-2">
              {t('Check here to learn more')}:{' '}
              <a
                className="text-blue-500 underline"
                href="https://tianji.msgbyte.com/docs/feed/sentry"
                target="_blank"
              >
                {t('Document')}
              </a>
            </div>
          </div>
        }
      />

      <div onClick={() => window.open('/feed/playground', '_blank')}>
        <FeedIntegrationItemTrigger
          icon={<LuTestTube2 size={32} />}
          label={t('Playground')}
        />
      </div>

      <FeedIntegrationItem
        icon={<LuPlug size={32} />}
        label={t('Custom')}
        content={
          <div>
            <div className="text-lg font-bold">{t('Custom Request')}</div>

            <div>{t('Send POST request to')}:</div>

            <CodeBlock
              code={`POST ${window.location.origin}/open/feed/${props.feedId}/send

Body
{
  eventName: "",
  eventContent: "",
  tags: [],
  source: "",
  senderId: "",
  senderName: "",
  important: false,
}`}
            />
          </div>
        }
      />
    </div>
  );
});
FeedIntegration.displayName = 'FeedIntegration';

const FeedIntegrationItem: React.FC<{
  icon: React.ReactNode;
  label: string;
  content: React.ReactNode;
}> = React.memo((props) => {
  return (
    <Popover>
      <PopoverTrigger>
        <FeedIntegrationItemTrigger icon={props.icon} label={props.label} />
      </PopoverTrigger>
      <PopoverContent className="w-screen sm:w-[640px]">
        {props.content}
      </PopoverContent>
    </Popover>
  );
});
FeedIntegrationItem.displayName = 'FeedIntegrationItem';

const FeedIntegrationItemTrigger: React.FC<{
  icon: React.ReactNode;
  label: string;
}> = React.memo((props) => {
  return (
    <div className="border-muted hover:bg-muted flex h-20 w-20 cursor-pointer flex-col items-center justify-center rounded-lg border p-2 text-center">
      <div className="mb-1">{props.icon}</div>
      <div className="text-sm">{props.label}</div>
    </div>
  );
});
FeedIntegrationItemTrigger.displayName = 'FeedIntegrationItemTrigger';
