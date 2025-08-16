import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import { CommonHeader } from '@/components/CommonHeader';
import { Layout } from '@/components/layout';
import { useCurrentWorkspaceId } from '@/store/user';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  LuPlus,
  LuSend,
  LuLink,
  LuPaperclip,
  LuDatabase,
  LuChartLine,
  LuHash,
  LuTag,
} from 'react-icons/lu';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import * as React from 'react';
import { useChat } from '@ai-sdk/react';
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import { useEvent } from '@/hooks/useEvent';

type AskForConfirmationInput = { message: string };
type WeatherInformationInput = { city: string };

function isAskForConfirmationInput(
  input: unknown
): input is AskForConfirmationInput {
  return (
    typeof input === 'object' &&
    input !== null &&
    typeof (input as any).message === 'string'
  );
}

function isWeatherInformationInput(
  input: unknown
): input is WeatherInformationInput {
  return (
    typeof input === 'object' &&
    input !== null &&
    typeof (input as any).city === 'string'
  );
}

export const Route = createFileRoute('/insights/warehouse')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const [input, setInput] = React.useState('');

  const { messages, sendMessage, status, addToolResult } = useChat({
    transport: new DefaultChatTransport({
      api: `/api/ai/${workspaceId}/chat`,
    }),
    sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
    async onToolCall({ toolCall }) {
      if (toolCall.toolName === 'getLocation') {
        const cities = ['New York', 'Los Angeles', 'Chicago', 'San Francisco'];

        // No await - avoids potential deadlocks
        addToolResult({
          tool: 'getLocation',
          toolCallId: toolCall.toolCallId,
          output: cities[Math.floor(Math.random() * cities.length)],
        });
      }
    },
  });

  const handleSend = useEvent(async () => {
    if (!input.trim()) {
      return;
    }

    await sendMessage({
      text: input.trim(),
    });
    setInput('');
  });

  return (
    <Layout>
      <CommonWrapper
        header={
          <CommonHeader
            title={
              <div className="flex items-center gap-2">
                <div>{t('Warehouse')}</div>
              </div>
            }
          />
        }
      >
        <div className="h-full">
          <ResizablePanelGroup direction="horizontal">
            <ResizablePanel defaultSize={65} minSize={40}>
              <div className="flex h-full flex-col">
                <div className="flex h-[44px] items-center justify-between px-3">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {t('AI Results')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" Icon={LuPlus}>
                      {t('New insight')}
                    </Button>
                  </div>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800" />
                <ScrollArea className="flex-1">
                  <div className="space-y-3 p-4">
                    <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="text-sm font-semibold">
                        {t('Overview')}
                      </div>
                      <div className="text-muted-foreground mt-1 text-sm">
                        {t(
                          'A high-level summary of recent insights and detected anomalies will appear here.'
                        )}
                      </div>
                    </div>
                    <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="text-sm font-semibold">
                        {t('Key Metrics')}
                      </div>
                      <div className="text-muted-foreground mt-1 text-sm">
                        {t(
                          'Metrics, charts and AI-generated highlights will be displayed in this section.'
                        )}
                      </div>
                    </div>
                    <div className="rounded-md border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-950">
                      <div className="text-sm font-semibold">
                        {t('Recommendations')}
                      </div>
                      <div className="text-muted-foreground mt-1 text-sm">
                        {t(
                          'Actionable suggestions based on your data will be listed here.'
                        )}
                      </div>
                    </div>
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={35}
              minSize={25}
              maxSize={55}
              className="border-l border-zinc-200 dark:border-zinc-800"
            >
              <div className="flex h-full flex-col">
                <div className="flex h-[44px] items-center justify-between px-3">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {t('Chat')}
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="sm" variant="ghost" Icon={LuLink}>
                          {t('Link')}
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>
                          {t('Associate extra content')}
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>
                          <LuPaperclip className="mr-2 h-4 w-4" />
                          {t('Attach file...')}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <LuDatabase className="mr-2 h-4 w-4" />
                          {t('Link dataset...')}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <LuChartLine className="mr-2 h-4 w-4" />
                          {t('Link chart...')}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <LuHash className="mr-2 h-4 w-4" />
                          {t('Link event by ID...')}
                        </DropdownMenuItem>
                        <DropdownMenuItem>
                          <LuTag className="mr-2 h-4 w-4" />
                          {t('Add tag...')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button size="sm" variant="secondary">
                      {t('New chat')}
                    </Button>
                  </div>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800" />
                <ScrollArea className="flex-1">
                  <div className="space-y-3 p-3">
                    {messages.map((m) => (
                      <div
                        key={m.id}
                        className={
                          m.role === 'user'
                            ? 'flex justify-end'
                            : 'flex justify-start'
                        }
                      >
                        <div
                          className={
                            m.role === 'user'
                              ? 'max-w-[85%] rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white dark:bg-zinc-50 dark:text-zinc-900'
                              : 'max-w-[85%] rounded-lg bg-zinc-100 px-3 py-2 text-sm text-zinc-900 dark:bg-zinc-800 dark:text-zinc-50'
                          }
                        >
                          {m.parts.map((part) => {
                            switch (part.type) {
                              // render text parts as simple text:
                              case 'text':
                                return part.text;

                              // for tool parts, use the typed tool part names:
                              case 'tool-askForConfirmation': {
                                const callId = part.toolCallId;

                                switch (part.state) {
                                  case 'input-streaming':
                                    return (
                                      <div key={callId}>
                                        Loading confirmation request...
                                      </div>
                                    );
                                  case 'input-available':
                                    return (
                                      <div key={callId}>
                                        {isAskForConfirmationInput(part.input)
                                          ? part.input.message
                                          : null}
                                        <div className="mt-2 flex items-center gap-2">
                                          <Button
                                            size="sm"
                                            onClick={() =>
                                              addToolResult({
                                                tool: 'askForConfirmation',
                                                toolCallId: callId,
                                                output: 'Yes, confirmed.',
                                              })
                                            }
                                          >
                                            Yes
                                          </Button>
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            onClick={() =>
                                              addToolResult({
                                                tool: 'askForConfirmation',
                                                toolCallId: callId,
                                                output: 'No, denied',
                                              })
                                            }
                                          >
                                            No
                                          </Button>
                                        </div>
                                      </div>
                                    );
                                  case 'output-available':
                                    return (
                                      <div key={callId}>
                                        Location access allowed:{' '}
                                        {String(part.output)}
                                      </div>
                                    );
                                  case 'output-error':
                                    return (
                                      <div key={callId}>
                                        Error: {String(part.errorText)}
                                      </div>
                                    );
                                }
                                break;
                              }

                              case 'tool-getLocation': {
                                const callId = part.toolCallId;

                                switch (part.state) {
                                  case 'input-streaming':
                                    return (
                                      <div key={callId}>
                                        Preparing location request...
                                      </div>
                                    );
                                  case 'input-available':
                                    return (
                                      <div key={callId}>
                                        Getting location...
                                      </div>
                                    );
                                  case 'output-available':
                                    return (
                                      <div key={callId}>
                                        Location: {String(part.output)}
                                      </div>
                                    );
                                  case 'output-error':
                                    return (
                                      <div key={callId}>
                                        Error getting location:{' '}
                                        {String(part.errorText)}
                                      </div>
                                    );
                                }
                                break;
                              }

                              case 'tool-getWeatherInformation': {
                                const callId = part.toolCallId;

                                switch (part.state) {
                                  // example of pre-rendering streaming tool inputs:
                                  case 'input-streaming':
                                    return (
                                      <pre key={callId}>
                                        {JSON.stringify(part, null, 2)}
                                      </pre>
                                    );
                                  case 'input-available':
                                    return (
                                      <div key={callId}>
                                        Getting weather information for{' '}
                                        {isWeatherInformationInput(part.input)
                                          ? part.input.city
                                          : ''}
                                        ...
                                      </div>
                                    );
                                  case 'output-available':
                                    return (
                                      <div key={callId}>
                                        Weather in{' '}
                                        {isWeatherInformationInput(part.input)
                                          ? part.input.city
                                          : ''}
                                        : {String(part.output)}
                                      </div>
                                    );
                                  case 'output-error':
                                    return (
                                      <div key={callId}>
                                        Error getting weather for{' '}
                                        {isWeatherInformationInput(part.input)
                                          ? part.input.city
                                          : ''}
                                        : {String(part.errorText)}
                                      </div>
                                    );
                                }
                                break;
                              }
                            }
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </ScrollArea>
                <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={t('Type a message...')}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      Icon={LuSend}
                      iconType="right"
                      onClick={handleSend}
                      loading={status === 'streaming'}
                      disabled={status !== 'ready'}
                    >
                      {t('Send')}
                    </Button>
                  </div>
                  <div className="text-muted-foreground mt-1 text-[11px]">
                    {t('Press ⌘ Enter to send')}
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </div>
      </CommonWrapper>
    </Layout>
  );
}
