import React, { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { CodeExample } from '@/components/CodeExample';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCurrentWorkspaceId } from '@/store/user';
import { useTranslation } from '@i18next-toolkit/react';
import { LuCodeXml } from 'react-icons/lu';

interface AIRouterUsageBtnProps {
  routerId: string;
}

type AIRouterExampleKind =
  | 'openai-chat'
  | 'openai-responses'
  | 'anthropic-messages';

export const AIRouterUsageBtn: React.FC<AIRouterUsageBtnProps> = React.memo(
  ({ routerId }) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const [exampleKind, setExampleKind] =
      useState<AIRouterExampleKind>('openai-chat');

    const examples = useMemo(
      () =>
        buildAIRouterExamples({
          origin: window.location.origin,
          workspaceId,
          routerId,
          kind: exampleKind,
        }),
      [exampleKind, routerId, workspaceId]
    );

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" Icon={LuCodeXml} />
        </DialogTrigger>
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle>{t('AI Router Usage')}</DialogTitle>
            <DialogDescription>
              {t('Use the endpoint shape that matches your AI client.')}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 overflow-hidden">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-base font-medium">{t('Example')}</h3>
              <Select
                value={exampleKind}
                onValueChange={(value) =>
                  setExampleKind(value as AIRouterExampleKind)
                }
              >
                <SelectTrigger className="w-[210px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="openai-chat">
                    {t('OpenAI Chat')}
                  </SelectItem>
                  <SelectItem value="openai-responses">
                    {t('OpenAI Responses')}
                  </SelectItem>
                  <SelectItem value="anthropic-messages">
                    {t('Anthropic Messages')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800">
              <strong>{t('Base URL')}:</strong>{' '}
              <code className="break-all">
                {getAIRouterExampleUrl({
                  origin: window.location.origin,
                  workspaceId,
                  routerId,
                  kind: exampleKind,
                })}
              </code>
            </div>

            <CodeExample className="overflow-hidden" example={examples} />
          </div>
        </DialogContent>
      </Dialog>
    );
  }
);
AIRouterUsageBtn.displayName = 'AIRouterUsageBtn';

function buildAIRouterExamples(args: {
  origin: string;
  workspaceId: string;
  routerId: string;
  kind: AIRouterExampleKind;
}) {
  const url = getAIRouterExampleUrl(args);

  if (args.kind === 'anthropic-messages') {
    return {
      curl: {
        label: 'cURL',
        code: `curl -X POST '${url}' \\
  -H 'Content-Type: application/json' \\
  -H 'x-api-key: <YOUR_API_KEY>' \\
  -H 'anthropic-version: 2023-06-01' \\
  -d '{
  "model": "claude-opus-4-20250514",
  "max_tokens": 1024,
  "messages": [
    {
      "role": "user",
      "content": "Hello"
    }
  ]
}'`,
      },
      nodejs: {
        label: 'Node.js',
        code: `const Anthropic = require('@anthropic-ai/sdk');

const client = new Anthropic({
  apiKey: '<YOUR_API_KEY>',
  baseURL: '${url.replace('/v1/messages', '')}',
});

async function main() {
  const message = await client.messages.create({
    model: 'claude-opus-4-20250514',
    max_tokens: 1024,
    messages: [{ role: 'user', content: 'Hello' }],
  });

  console.log(message.content);
}

main();`,
      },
    };
  }

  if (args.kind === 'openai-responses') {
    return {
      curl: {
        label: 'cURL',
        code: `curl -X POST '${url}' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer <YOUR_API_KEY>' \\
  -d '{
  "model": "gpt-4o",
  "input": "Hello"
}'`,
      },
      nodejs: {
        label: 'Node.js',
        code: `const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: '<YOUR_API_KEY>',
  baseURL: '${url.replace('/v1/responses', '/v1')}',
});

async function main() {
  const response = await client.responses.create({
    model: 'gpt-4o',
    input: 'Hello',
  });

  console.log(response.output_text);
}

main();`,
      },
    };
  }

  return {
    curl: {
      label: 'cURL',
      code: `curl -X POST '${url}' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer <YOUR_API_KEY>' \\
  -d '{
  "model": "gpt-4o",
  "messages": [
    {
      "role": "user",
      "content": "Hello"
    }
  ]
}'`,
    },
    nodejs: {
      label: 'Node.js',
      code: `const OpenAI = require('openai');

const client = new OpenAI({
  apiKey: '<YOUR_API_KEY>',
  baseURL: '${url.replace('/chat/completions', '')}',
});

async function main() {
  const response = await client.chat.completions.create({
    model: 'gpt-4o',
    messages: [{ role: 'user', content: 'Hello' }],
  });

  console.log(response.choices[0].message);
}

main();`,
    },
  };
}

function getAIRouterExampleUrl(args: {
  origin: string;
  workspaceId: string;
  routerId: string;
  kind: AIRouterExampleKind;
}) {
  const baseUrl = `${args.origin}/api/ai-router/${args.workspaceId}/${args.routerId}`;

  if (args.kind === 'openai-responses') {
    return `${baseUrl}/openai/v1/responses`;
  }

  if (args.kind === 'anthropic-messages') {
    return `${baseUrl}/anthropic/v1/messages`;
  }

  return `${baseUrl}/openai/v1/chat/completions`;
}
