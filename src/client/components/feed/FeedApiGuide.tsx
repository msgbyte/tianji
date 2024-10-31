import { Card, CardContent, CardHeader } from '@/components/ui/card';
import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { CodeExample } from '../CodeExample';

interface FeedApiGuideProps {
  channelId: string;
  webhookSignature?: string;
}
export const FeedApiGuide: React.FC<FeedApiGuideProps> = React.memo((props) => {
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
              code: generateCurlCode(props.channelId, props.webhookSignature),
            },
            fetch: {
              label: 'fetch',
              code: generateFetchCode(props.channelId, props.webhookSignature),
            },
          }}
        />

        <div className="pl-2 font-bold">{t('OR')}</div>

        <div>{t('Integrate with third party with webhook')}</div>
      </CardContent>
    </Card>
  );
});
FeedApiGuide.displayName = 'FeedApiGuide';

function generateCurlCode(channelId: string, webhookSignature?: string) {
  if (webhookSignature) {
    return `curl -X POST ${window.location.origin}/open/feed/${channelId}/send \\
-H "Content-Type: application/json" \\
-H "X-Webhook-Signature: ${webhookSignature}" \\
-d '{
  "eventName": "test name",
  "eventContent": "test content",
  "tags": ["test"],
  "source": "custom",
  "important": false
}'`;
  }

  return `curl -X POST ${window.location.origin}/open/feed/${channelId}/send \\
-H "Content-Type: application/json" \\
-d '{
  "eventName": "test name",
  "eventContent": "test content",
  "tags": ["test"],
  "source": "custom",
  "important": false
}'`;
}

function generateFetchCode(channelId: string, webhookSignature?: string) {
  if (webhookSignature) {
    return `fetch('${window.location.origin}/open/feed/${channelId}/send', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': '${webhookSignature}'
  },
  body: JSON.stringify({
    eventName: 'test name',
    eventContent: 'test content',
    tags: ['test'],
    source: 'custom',
    important: false,
  })
})`;
  }

  return `fetch('${window.location.origin}/open/feed/${channelId}/send', {
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
}
