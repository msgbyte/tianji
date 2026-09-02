import { AppRouterOutput } from '@/api/trpc';
import { useTranslation } from '@i18next-toolkit/react';
import { Image } from 'antd';
import dayjs from 'dayjs';
import React from 'react';
import { CodeBlock } from '../CodeBlock';
import { SheetDataSection } from '../ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AIGatewayStatus } from './AIGatewayStatus';

export type AIGatewayLogItem =
  AppRouterOutput['aiGateway']['logs']['items'][number];

interface AIGatewayLogDetailProps {
  item: AIGatewayLogItem;
}

export const AIGatewayLogDetail: React.FC<AIGatewayLogDetailProps> =
  React.memo(({ item }) => {
    const { t } = useTranslation();
    const requestPayload =
      item.requestPayload &&
      typeof item.requestPayload === 'object' &&
      !Array.isArray(item.requestPayload)
        ? item.requestPayload
        : null;
    const defaultRequestTab =
      requestPayload?.messages !== undefined
        ? 'messages'
        : requestPayload?.tools !== undefined
          ? 'tools'
          : 'raw';
    const messageImageUrls = getMessageImageUrls(requestPayload?.messages);

    return (
      <div>
        <SheetDataSection label="ID">{item.id}</SheetDataSection>
        <SheetDataSection label={t('Statue')}>
          <AIGatewayStatus status={item.status} />
        </SheetDataSection>

        <SheetDataSection label={t('Model')}>
          {item.modelName ?? <span className="opacity-40">(null)</span>}
        </SheetDataSection>

        <SheetDataSection label={t('User')}>
          {item.userId ?? <span className="opacity-40">-</span>}
        </SheetDataSection>

        <SheetDataSection label={t('Created At')}>
          {dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
        </SheetDataSection>

        <SheetDataSection label={t('Price')}>
          <span className="mr-1 opacity-60">$</span>
          {item.price}
        </SheetDataSection>

        <SheetDataSection label={t('Duration')}>
          {item.duration} ms
        </SheetDataSection>

        <SheetDataSection label="TTFT">
          {renderNullableTiming(item.ttft, 'ms')}
        </SheetDataSection>

        <SheetDataSection label="TPOT">
          {renderNullableTiming(item.tpot, 'ms/token')}
        </SheetDataSection>

        <SheetDataSection label="Output TPS">
          {renderOutputTpsText(item.tpot)}
        </SheetDataSection>

        <SheetDataSection label="Tokens">
          {item.inputToken}↑ | {item.outputToken}↓
          {item.cacheReadInputToken > 0 && (
            <> | {item.cacheReadInputToken} cache read</>
          )}
          {item.cacheWriteInputToken > 0 && (
            <> | {item.cacheWriteInputToken} cache write</>
          )}
        </SheetDataSection>

        <SheetDataSection label={t('Request Payload')}>
          <Tabs defaultValue={defaultRequestTab}>
            <TabsList>
              {requestPayload?.messages !== undefined && (
                <TabsTrigger value="messages">Messages</TabsTrigger>
              )}
              {requestPayload?.tools !== undefined && (
                <TabsTrigger value="tools">Tools</TabsTrigger>
              )}
              <TabsTrigger value="raw">Raw Request</TabsTrigger>
            </TabsList>

            {requestPayload?.messages !== undefined && (
              <TabsContent value="messages">
                {renderJsonData(requestPayload.messages)}
                {messageImageUrls.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {messageImageUrls.map((url, index) => (
                      <Image
                        key={index}
                        src={url}
                        alt="Message attachment"
                        width={64}
                        height={64}
                        className="rounded object-cover"
                        preview={{ destroyOnClose: true }}
                      />
                    ))}
                  </div>
                )}
              </TabsContent>
            )}
            {requestPayload?.tools !== undefined && (
              <TabsContent value="tools">
                {renderJsonData(requestPayload.tools)}
              </TabsContent>
            )}
            <TabsContent value="raw">
              {renderJsonData(item.requestPayload)}
            </TabsContent>
          </Tabs>
        </SheetDataSection>

        <SheetDataSection label={t('Response Payload')}>
          {renderJsonData(item.responsePayload)}
        </SheetDataSection>
      </div>
    );
  });

AIGatewayLogDetail.displayName = 'AIGatewayLogDetail';

function renderJsonData(data: any) {
  try {
    return <CodeBlock code={JSON.stringify(data, null, 2)} />;
  } catch (err) {
    return <div className="text-red-500">{String(err)}</div>;
  }
}

function getMessageImageUrls(messages: any): string[] {
  if (!Array.isArray(messages)) {
    return [];
  }

  return messages.flatMap((message) =>
    Array.isArray(message?.content)
      ? message.content
          .filter(
            (part: any) =>
              part?.type === 'image_url' &&
              typeof part.image_url?.url === 'string'
          )
          .map((part: any) => part.image_url.url)
      : []
  );
}

function renderNullableTiming(value: number, suffix: string) {
  if (value === -1) {
    return <span className="opacity-40">(null)</span>;
  }

  return `${value} ${suffix}`;
}

function renderOutputTpsText(tpot: number) {
  if (tpot <= 0) {
    return <span className="opacity-40">(null)</span>;
  }

  return `${(1000 / tpot).toFixed(2)} token/s`;
}
