import { Card, CardContent, CardHeader } from '@/components/ui/card';
import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { CodeExample } from '../CodeExample';

export const FeedApiGuide: React.FC<{ channelId: string }> = React.memo(
  (props) => {
    const { t } = useTranslation();

    return (
      <Card className="w-full overflow-hidden">
        <CardHeader>
          <div>{t('You can send a message to this channel with:')}</div>
        </CardHeader>
        <CardContent className="flex w-full flex-col gap-5 overflow-hidden">
          <CodeExample
            example={{
              curl: {
                label: 'curl',
                code: generateCurlCode(props.channelId),
              },
              fetch: {
                label: 'fetch',
                code: generateFetchCode(props.channelId),
              },
            }}
          />

          <div className="pl-2 font-bold">{t('OR')}</div>

          <div>{t('Integrate with third party with webhook')}</div>
        </CardContent>
      </Card>
    );
  }
);
FeedApiGuide.displayName = 'FeedApiGuide';

function generateCurlCode(channelId: string) {
  const code = `curl -X POST ${window.location.origin}/open/feed/${channelId}/send \\
-H "Content-Type: application/json" \\
-d '{
  "eventName": "test name",
  "eventContent": "test content",
  "tags": ["test"],
  "source": "custom",
  "important": false
}'`;

  return code;
}

function generateFetchCode(channelId: string) {
  const code = `fetch('${window.location.origin}/open/feed/${channelId}/send', {
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

  return code;
}
