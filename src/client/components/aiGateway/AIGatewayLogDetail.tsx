import { AppRouterOutput, trpc } from '@/api/trpc';
import { useTranslation } from '@i18next-toolkit/react';
import dayjs from 'dayjs';
import React from 'react';
import { CodeBlock } from '../CodeBlock';
import { Loading } from '../Loading';
import { Button } from '../ui/button';
import { ImagePreview } from '../ImagePreview';
import { SheetDataSection } from '../ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { AIGatewayStatus } from './AIGatewayStatus';

export type AIGatewayLogItem =
  AppRouterOutput['aiGateway']['logs']['items'][number];

export type AIGatewayLogDetailItem = AppRouterOutput['aiGateway']['logDetail'];

interface AIGatewayLogDetailProps {
  item: AIGatewayLogItem;
}

export const AIGatewayLogDetail: React.FC<AIGatewayLogDetailProps> = React.memo(
  ({ item }) => {
    const { t } = useTranslation();

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

        <AIGatewayLogPayload key={item.id} item={item}>
          {(detail) => <PayloadContent item={detail} />}
        </AIGatewayLogPayload>
      </div>
    );
  }
);

AIGatewayLogDetail.displayName = 'AIGatewayLogDetail';

export function AIGatewayLogPayload({
  item,
  live = true,
  children,
}: {
  item: AIGatewayLogItem;
  live?: boolean;
  children: (detail: AIGatewayLogDetailItem) => React.ReactNode;
}) {
  const { t } = useTranslation();
  const { data, error, refetch, isFetching } =
    trpc.aiGateway.logDetail.useQuery(
      {
        workspaceId: item.workspaceId,
        gatewayId: item.gatewayId,
        logId: item.id,
      },
      {
        trpc: { context: { skipBatch: true }, abortOnUnmount: true },
        refetchInterval: (query) =>
          live && query.state.data?.status === 'Pending' ? 2000 : false,
      }
    );

  return (
    <>
      {error ? (
        <div role="alert" className="space-y-2 p-4">
          <p>{t('Failed to load payloads')}</p>
          <Button
            variant="outline"
            loading={isFetching}
            onClick={() => refetch()}
          >
            {t('Retry')}
          </Button>
        </div>
      ) : !data ? (
        <div role="status" className="flex items-center gap-2 p-4">
          <Loading />
          {t('Loading payloads…')}
        </div>
      ) : null}
      {data && children(data)}
    </>
  );
}

function PayloadContent({ item }: { item: AIGatewayLogDetailItem }) {
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
  const responsePayload =
    item.responsePayload &&
    typeof item.responsePayload === 'object' &&
    !Array.isArray(item.responsePayload)
      ? item.responsePayload
      : null;
  const { content: responseContent, ...responseParameters } =
    responsePayload ?? {};
  const defaultResponseTab =
    responseContent !== undefined
      ? 'content'
      : responsePayload
        ? 'parameters'
        : 'raw';

  return (
    <>
      <SheetDataSection label={t('Request Payload')}>
        <Tabs defaultValue={defaultRequestTab}>
          <TabsList>
            {requestPayload?.messages !== undefined && (
              <TabsTrigger value="messages">{t('Messages')}</TabsTrigger>
            )}
            {requestPayload?.tools !== undefined && (
              <TabsTrigger value="tools">{t('Tools')}</TabsTrigger>
            )}
            <TabsTrigger value="raw">{t('Raw Request')}</TabsTrigger>
          </TabsList>

          {requestPayload?.messages !== undefined && (
            <TabsContent value="messages">
              {renderJsonData(requestPayload.messages)}
              {messageImageUrls.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {messageImageUrls.map((url, index) => (
                    <ImagePreview
                      key={index}
                      src={url}
                      alt={t('Message attachment')}
                      width={64}
                      height={64}
                      className="rounded object-cover"
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
        <Tabs defaultValue={defaultResponseTab}>
          <TabsList>
            <TabsTrigger value="parameters">{t('Parameters')}</TabsTrigger>
            <TabsTrigger value="content">{t('Content')}</TabsTrigger>
            <TabsTrigger value="raw">{t('Raw Response')}</TabsTrigger>
          </TabsList>

          <TabsContent value="parameters">
            {renderJsonData(responseParameters)}
          </TabsContent>
          <TabsContent value="content">
            {renderJsonData(responseContent ?? null)}
          </TabsContent>
          <TabsContent value="raw">
            {renderJsonData(item.responsePayload)}
          </TabsContent>
        </Tabs>
      </SheetDataSection>
    </>
  );
}

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
