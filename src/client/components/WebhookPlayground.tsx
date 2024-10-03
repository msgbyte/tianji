import React, { useMemo, useState } from 'react';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from './ui/resizable';
import { cn } from '@/utils/style';
import { ScrollArea } from './ui/scroll-area';
import { Trans, useTranslation } from '@i18next-toolkit/react';
import { Empty } from 'antd';
import { Button } from './ui/button';
import copy from 'copy-to-clipboard';
import { toast } from 'sonner';
import { Code } from './Code';
import { useCurrentWorkspaceId } from '@/store/user';
import { Badge } from './ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { reverse, toPairs } from 'lodash-es';
import { CodeBlock } from './CodeBlock';
import dayjs from 'dayjs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { useEvent } from '@/hooks/useEvent';
import { useSocketSubscribeList } from '@/api/socketio';
import { Spinner } from './ui/spinner';

export const WebhookPlayground: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(
    null
  );
  const workspaceId = useCurrentWorkspaceId();

  const requestList = useSocketSubscribeList(
    'onReceivePlaygroundWebhookRequest'
  );

  const selectedRequest = useMemo(() => {
    return requestList.find((item) => item.id === selectedRequestId);
  }, [selectedRequestId, requestList]);

  const handleCopyAsCurl = useEvent(() => {
    if (!selectedRequest) {
      return;
    }

    const url = selectedRequest.url.startsWith('/')
      ? `${window.location.origin}${selectedRequest.url}`
      : selectedRequest.url;
    const command = [
      'curl',
      `-X ${selectedRequest.method}`,
      `${toPairs(selectedRequest.headers)
        .filter(([key]) => !['content-length'].includes(key.toLowerCase()))
        .map(([key, value]) => `-H '${key}: ${value}'`)
        .join(' ')}`,
      `-d '${JSON.stringify(selectedRequest.body)}'`,
      `'${url}'`,
    ].join(' ');
    copy(command);
    toast.success('Copied into your clipboard!');
  });

  const list = (
    <ScrollArea className="flex-1">
      <div className="flex flex-col gap-2 p-2">
        {requestList.length === 0 && (
          <div className="pt-10">
            <Empty
              description={t(
                'Currently waiting for a new request from the remote server'
              )}
            />

            <div className="mt-2 flex justify-center text-center">
              <Spinner size={24} />
            </div>
          </div>
        )}

        {reverse([...requestList]).map((item) => {
          return (
            <button
              key={item.id}
              className={cn(
                'flex flex-col items-start gap-2 rounded-lg border p-3 text-left text-sm transition-all',
                selectedRequestId === item.id
                  ? 'bg-gray-100 dark:!bg-gray-800'
                  : 'hover:bg-gray-50 dark:hover:bg-gray-900'
              )}
              onClick={() => {
                setSelectedRequestId(item.id);
              }}
            >
              <div className="flex w-full items-center justify-between gap-2">
                <Badge>{item.method}</Badge>

                <div className="text-xs opacity-80">
                  {dayjs(item.createdAt).fromNow()}
                </div>
              </div>
              <div className="flex w-full items-center justify-between gap-1">
                <div className="overflow-hidden text-ellipsis font-semibold">
                  {item.url}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </ScrollArea>
  );

  const webhookUrl = `${window.location.origin}/open/feed/playground/${workspaceId}`;
  const emptyContentFallback = (
    <div className="pt-8">
      <div>
        <Trans>
          Set the webhook URL to <Code children={webhookUrl} />, and keep this
          window active. Once done, you will start receiving webhook requests
          here.
        </Trans>
      </div>
      <Button
        className="mt-2"
        size="sm"
        onClick={() => {
          copy(webhookUrl);
          toast.success('Copied into your clipboard!');
        }}
      >
        {t('Copy URL')}
      </Button>
    </div>
  );

  const copyBtn = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">{t('Copy as')}</Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" side="bottom" align="end">
        <DropdownMenuItem onClick={handleCopyAsCurl}>cURL</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );

  const content = selectedRequest ? (
    <div className="flex flex-col gap-2">
      <div>
        <div className="flex gap-2">
          <Badge>{selectedRequest.method}</Badge>
          <div className="flex w-full flex-1 items-center justify-between gap-1 overflow-hidden text-ellipsis font-semibold">
            {selectedRequest.url}
          </div>
          {copyBtn}
        </div>
        <div className="text-right text-xs opacity-80">
          {dayjs(selectedRequest.createdAt).fromNow()}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-2 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t('Request Header')}</CardTitle>
          </CardHeader>

          <CardContent>
            {toPairs(selectedRequest.headers).map(([key, value]) => {
              return (
                <div key={key} className="flex items-center justify-between">
                  <div className="overflow-hidden text-ellipsis font-semibold">
                    {key}
                  </div>
                  <div className="overflow-hidden text-ellipsis">{value}</div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('Request Body')}</CardTitle>
          </CardHeader>

          <CardContent>
            <CodeBlock
              height={600}
              code={JSON.stringify(selectedRequest.body, null, 2)}
            />
          </CardContent>
        </Card>
      </div>
    </div>
  ) : (
    emptyContentFallback
  );

  return (
    <div className="h-full w-full">
      <ResizablePanelGroup
        direction="horizontal"
        className="h-full items-stretch"
      >
        <ResizablePanel
          defaultSize={30}
          collapsible={false}
          minSize={20}
          maxSize={50}
          className={cn('flex flex-col')}
        >
          {list}
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel>
          <ScrollArea className="h-full px-4 py-2">{content}</ScrollArea>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
});
WebhookPlayground.displayName = 'WebhookPlayground';
