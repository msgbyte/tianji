import { Card, CardContent, CardHeader } from '@/components/ui/card';
import React from 'react';
import { CodeBlock } from '../CodeBlock';
import { useTranslation } from '@i18next-toolkit/react';

export const FeedApiGuide: React.FC<{ channelId: string }> = React.memo(
  (props) => {
    const { t } = useTranslation();

    const code = `fetch('${window.location.origin}/open/feed/${props.channelId}/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    eventName: 'test name',
    eventContent: 'test content',
    tags: ['test'],
    source: 'custom',
    important: false,
  })
})`;

    return (
      <Card className="w-full overflow-hidden">
        <CardHeader>
          <div>{t('You can send any message into this channel with:')}</div>
        </CardHeader>
        <CardContent className="flex w-full flex-col gap-5 overflow-hidden">
          <CodeBlock code={code} />

          <div className="pl-2 font-bold">{t('OR')}</div>

          <div>{t('Integrate with third party with webhook')}</div>
        </CardContent>
      </Card>
    );
  }
);
FeedApiGuide.displayName = 'FeedApiGuide';
