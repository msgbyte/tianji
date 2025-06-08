import React, { useMemo, useState } from 'react';
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
import { LuCodeXml } from 'react-icons/lu';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { CodeExample } from '../CodeExample';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface AIGatewayCodeExampleBtnProps {
  gatewayId: string;
}

// Define AI provider types
type AIProvider = 'openai' | 'deepseek' | 'openrouter' | 'custom';

// Define interface and models for each AI provider
interface ProviderConfig {
  endpoint: string; // API endpoint path
  defaultModel: string; // Default model
  description?: string; // Description
  label: string; // Display name
}

export const AIGatewayCodeExampleBtn: React.FC<AIGatewayCodeExampleBtnProps> =
  React.memo((props) => {
    const { gatewayId } = props;
    const workspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation();
    const [selectedProvider, setSelectedProvider] =
      useState<AIProvider>('openai');

    const { data: gateway } = trpc.aiGateway.info.useQuery({
      workspaceId,
      gatewayId,
    });

    // Define configurations for different providers
    const providerConfigs: Record<AIProvider, ProviderConfig> = useMemo(
      () => ({
        openai: {
          endpoint:
            '/api/ai/v1/${workspaceId}/${gatewayId}/openai/chat/completions',
          defaultModel: 'gpt-4o',
          description: t('OpenAI API compatible'),
          label: 'OpenAI API',
        },
        deepseek: {
          endpoint:
            '/api/ai/v1/${workspaceId}/${gatewayId}/deepseek/chat/completions',
          defaultModel: 'deepseek-chat',
          description: t('Deepseek API compatible'),
          label: 'Deepseek API',
        },
        openrouter: {
          endpoint:
            '/api/ai/v1/${workspaceId}/${gatewayId}/openrouter/chat/completions',
          defaultModel: 'openai/gpt-4o-mini',
          description: t('OpenRouter API compatible'),
          label: 'OpenRouter API',
        },
        custom: {
          endpoint:
            '/api/ai/v1/${workspaceId}/${gatewayId}/custom/chat/completions',
          defaultModel: 'custom-model',
          description: t('Custom model API with your own settings'),
          label: 'Custom API',
        },
      }),
      [gatewayId]
    );

    // Generate base code template
    const generateCodeTemplate = (provider: AIProvider, language: string) => {
      const config = providerConfigs[provider];
      const endpoint = config.endpoint
        .replace('${workspaceId}', workspaceId)
        .replace('${gatewayId}', gatewayId);
      const model = config.defaultModel;

      // Generate different code based on language
      switch (language) {
        case 'nodejs':
          return `const axios = require('axios');

async function callAIGateway() {
  try {
    const response = await axios.post(
      '${window.location.origin}${endpoint}',
      {
        messages: [
          {
            role: "system",
            content: "You are an AI assistant"
          },
          {
            role: "user",
            content: "Hello"
          }
        ],
        model: "${model}"
      },
      {
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bearer YOUR_API_KEY"
        }
      }
    );
    console.log(response.data);
  } catch (error) {
    console.error('Request failed:', error);
  }
}

callAIGateway();`;

        case 'python':
          return `import requests
import json

def call_ai_gateway():
    url = '${window.location.origin}${endpoint}'

    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer YOUR_API_KEY"
    }

    data = {
        "messages": [
            {
                "role": "system",
                "content": "You are an AI assistant"
            },
            {
                "role": "user",
                "content": "Hello"
            }
        ],
        "model": "${model}"
    }

    response = requests.post(url, headers=headers, data=json.dumps(data))

    if response.status_code == 200:
        print(response.json())
    else:
        print(f'Request failed: {response.status_code}')

call_ai_gateway()`;

        case 'curl':
          return `curl -X POST '${window.location.origin}${endpoint}' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: Bearer YOUR_API_KEY' \\
  -d '{
  "messages": [
    {
      "role": "system",
      "content": "You are an AI assistant"
    },
    {
      "role": "user",
      "content": "Hello"
    }
  ],
  "model": "${model}"
}'`;

        default:
          return '';
      }
    };

    // Generate code examples for different providers and languages
    const generateCode = (provider: AIProvider, language: string) => {
      return generateCodeTemplate(provider, language);
    };

    const currentConfig = providerConfigs[selectedProvider];

    return (
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" size="icon" Icon={LuCodeXml} />
        </DialogTrigger>
        <DialogContent className="flex max-h-[90vh] max-w-3xl flex-col overflow-y-auto">
          <DialogHeader className="mb-4">
            <DialogTitle>{t('AI Gateway Usage')}</DialogTitle>
            <DialogDescription>
              {t(
                'Use these code examples to integrate the AI Gateway in your project'
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="flex-1 overflow-auto">
            <div className="space-y-4">
              {/* Basic information area */}
              <div className="rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800">
                <h3 className="mb-2 font-medium text-gray-700 dark:text-gray-300">
                  {t('Gateway Information')}
                </h3>
                <div className="space-y-1">
                  <p>
                    <strong>{t('Gateway Name')}:</strong> {gateway?.name}
                  </p>
                  <p>
                    <strong>{t('Gateway ID')}:</strong> {gatewayId}
                  </p>
                </div>
              </div>

              {/* Provider selector */}
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium">
                  {t('Select API Provider')}
                </h3>
                <Select
                  value={selectedProvider}
                  onValueChange={(value) =>
                    setSelectedProvider(value as AIProvider)
                  }
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder={t('Select API Provider')} />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(providerConfigs).map(([key, config]) => (
                      <SelectItem key={key} value={key}>
                        {t(config.label)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Current selected provider information */}
              <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800 dark:bg-blue-950 dark:text-blue-200">
                <h3 className="mb-2 font-medium">{t(currentConfig.label)}</h3>
                <p>
                  <strong>{t('Endpoint')}:</strong>{' '}
                  <code className="break-all rounded bg-blue-100 px-1 py-0.5 text-blue-900 dark:bg-blue-900 dark:text-blue-100">
                    {window.location.origin}
                    {currentConfig.endpoint
                      .replace('${workspaceId}', workspaceId)
                      .replace('${gatewayId}', gatewayId)}
                  </code>
                </p>
              </div>

              {/* Code example area */}
              <div className="overflow-hidden">
                <CodeExample
                  className="overflow-hidden"
                  example={{
                    curl: {
                      label: 'cURL',
                      code: generateCode(selectedProvider, 'curl'),
                    },
                    python: {
                      label: 'Python',
                      code: generateCode(selectedProvider, 'python'),
                    },
                    nodejs: {
                      label: 'Node.js',
                      code: generateCode(selectedProvider, 'nodejs'),
                    },
                  }}
                />
              </div>

              {/* Important information tips */}
              <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-300">
                <p className="font-medium">{t('Important Notes')}:</p>
                <ul className="ml-5 mt-1 list-disc space-y-1">
                  <li>
                    {t('Replace "YOUR_API_KEY" with your actual API key')}
                  </li>
                  <li>
                    {t('The model name may vary based on your configuration')}
                  </li>
                  <li>
                    {t(
                      'Each provider may have different request format requirements'
                    )}
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  });

AIGatewayCodeExampleBtn.displayName = 'AIGatewayCodeExampleBtn';
