import { Card, CardContent, CardHeader } from '@/components/ui/card';
import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { CodeExample } from '../CodeExample';
import { useCurrentWorkspaceId } from '@/store/user';

interface FeedApiGuideProps {
  channelId: string;
  webhookSignature?: string;
}
export const FeedApiGuide: React.FC<FeedApiGuideProps> = React.memo((props) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();

  return (
    <Card className="w-full overflow-hidden">
      <CardHeader>
        <div>{t('You can send a message to this channel with:')}</div>
      </CardHeader>
      <CardContent className="flex w-full flex-col gap-5 overflow-hidden">
        <CodeExample
          example={{
            event: {
              label: t('Event'),
              element: (
                <div className="space-y-3">
                  <div className="text-muted-foreground">
                    {t(
                      'Events are instant messages that notify about something that happened at a specific moment, without requiring further status updates. Suitable for notifications, alerts, and one-time information delivery.'
                    )}
                  </div>
                  <h3 className="font-medium">{t('Send Event')}</h3>
                  <CodeExample
                    example={{
                      curl: {
                        label: 'curl',
                        code: generateCurlCode(
                          props.channelId,
                          props.webhookSignature
                        ),
                      },
                      fetch: {
                        label: 'fetch',
                        code: generateFetchCode(
                          props.channelId,
                          props.webhookSignature
                        ),
                      },
                    }}
                  />
                </div>
              ),
            },
            state: {
              label: t('State'),
              element: (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <div className="text-muted-foreground">
                      {t(
                        'States are special stateful events used to track ongoing issues. They use Ongoing and Resolved statuses to mark the beginning and end of an incident, making them ideal for long-term issue or incident tracking.'
                      )}
                    </div>
                    <h3 className="font-medium">{t('Create/Update State')}</h3>
                    <CodeExample
                      example={{
                        curl: {
                          label: 'curl',
                          code: generateStateUpsertCurlCode(
                            props.channelId,
                            props.webhookSignature
                          ),
                        },
                        fetch: {
                          label: 'fetch',
                          code: generateStateUpsertFetchCode(
                            props.channelId,
                            props.webhookSignature
                          ),
                        },
                      }}
                    />
                  </div>
                </div>
              ),
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

function generateStateUpsertCurlCode(
  channelId: string,
  webhookSignature?: string
) {
  if (webhookSignature) {
    return `curl -X POST ${window.location.origin}/open/feed/${channelId}/state/upsert \\
  -H "Content-Type: application/json" \\
  -H "X-Webhook-Signature: ${webhookSignature}" \\
  -d '{
    "eventId": "issue-123",
    "eventName": "Service Degradation",
    "eventContent": "API response time exceeds threshold",
    "tags": ["api", "performance"],
    "source": "monitoring",
    "important": true
  }'`;
  }

  return `curl -X POST ${window.location.origin}/open/feed/${channelId}/state/upsert \\
  -H "Content-Type: application/json" \\
  -d '{
    "eventId": "issue-123",
    "eventName": "Service Degradation",
    "eventContent": "API response time exceeds threshold",
    "tags": ["api", "performance"],
    "source": "monitoring",
    "important": true
  }'`;
}

function generateStateUpsertFetchCode(
  channelId: string,
  webhookSignature?: string
) {
  if (webhookSignature) {
    return `fetch('${window.location.origin}/open/feed/${channelId}/state/upsert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Webhook-Signature': '${webhookSignature}'
  },
  body: JSON.stringify({
    eventId: 'issue-123',
    eventName: 'Service Degradation',
    eventContent: 'API response time exceeds threshold',
    tags: ['api', 'performance'],
    source: 'monitoring',
    important: true
  })
})`;
  }

  return `fetch('${window.location.origin}/open/feed/${channelId}/state/upsert', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    eventId: 'issue-123',
    eventName: 'Service Degradation',
    eventContent: 'API response time exceeds threshold',
    tags: ['api', 'performance'],
    source: 'monitoring',
    important: true
  })
})`;
}
