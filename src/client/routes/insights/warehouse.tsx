import { createFileRoute } from '@tanstack/react-router';
import { t, useTranslation } from '@i18next-toolkit/react';
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
  LuCircleAlert,
  LuCircleStop,
  LuTrash2,
} from 'react-icons/lu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useChat } from '@ai-sdk/react';
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import { useEvent } from '@/hooks/useEvent';
import { useMemo, useReducer, useState } from 'react';
import { sleep } from '@tianji/shared';
import { Suggestion, Suggestions } from '@/components/ai-elements/suggestion';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '@/components/ai-elements/conversation';
import { formatNumber, generateRandomString } from '@/utils/common';
import { AIResponseMessages } from '@/components/ai/AIResponseMessages';
import { WarehouseChartBlock } from '@/components/insights/WarehouseChartBlock';
import { TimeEventChartType } from '@/components/chart/TimeEventChart';

export const Route = createFileRoute('/insights/warehouse')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

const suggestions = [
  t('Please help me generate the revenue data for the past week'),
];

function PageComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const [input, setInput] = useState('');
  const [id, refreshId] = useReducer(
    () => generateRandomString(14),
    '',
    () => generateRandomString(14)
  );
  const [usage, setUsage] = useState<{
    cachedInputTokens: number;
    inputTokens: number;
    outputTokens: number;
    reasoningTokens: number;
    totalTokens: number;
  } | null>(null);

  // local chart blocks state
  const [chartBlocks, setChartBlocks] = useState<
    Array<{
      id: string;
      title: string;
      data: Array<Record<string, any>>;
      type: TimeEventChartType;
    }>
  >([]);

  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: `/api/insights/${workspaceId}/chat`,
      }),
    [workspaceId]
  );

  const { messages, sendMessage, stop, status, error, addToolResult } = useChat(
    {
      id,
      transport,
      sendAutomaticallyWhen: lastAssistantMessageIsCompleteWithToolCalls,
      async onToolCall({ toolCall }) {
        if (toolCall.toolName === 'getLocation') {
          const cities = [
            'New York',
            'Los Angeles',
            'Chicago',
            'San Francisco',
          ];

          await sleep(2000);

          addToolResult({
            tool: 'getLocation',
            toolCallId: toolCall.toolCallId,
            output: cities[Math.floor(Math.random() * cities.length)],
          });
        }

        if (toolCall.toolName === 'createCharts') {
          try {
            const input = toolCall.input as {
              data?: Array<Record<string, any>>;
              title?: string;
              type?: TimeEventChartType;
            };
            const data = Array.isArray(input.data) ? input.data : [];
            const title =
              typeof input.title === 'string' ? input.title : 'Chart';
            const type = typeof input.type === 'string' ? input.type : 'line';

            if (data.length === 0) {
              throw new Error('No data provided');
            }

            setChartBlocks((prev) => [
              { id: generateRandomString(8), title, data, type },
              ...prev,
            ]);

            addToolResult({
              tool: 'createCharts',
              toolCallId: toolCall.toolCallId,
              output: 'Chart created',
            });
          } catch (e) {
            addToolResult({
              tool: 'createCharts',
              toolCallId: toolCall.toolCallId,
              error: String(e),
            } as any);
          }
        }
      },
      onData(data) {
        if (data.type === 'data-usage') {
          setUsage(data.data as any);
        }
      },
    }
  );

  const handleSend = useEvent(async () => {
    if (!input.trim()) {
      return;
    }

    await sendMessage({
      text: input.trim(),
    });
    setInput('');
  });

  const handleStop = useEvent(() => {
    stop();
  });

  const handleSuggestionClick = useEvent((suggestion: string) => {
    sendMessage({ text: suggestion });
  });

  const handleReset = useEvent(() => {
    refreshId();
    setUsage(null);
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
            <ResizablePanel defaultSize={50} minSize={35}>
              <div className="flex h-full flex-col">
                <div className="flex h-[44px] items-center justify-between px-3">
                  <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">
                    {t('AI Results')}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      Icon={LuTrash2}
                      onClick={() => setChartBlocks([])}
                    >
                      {t('Clear All')}
                    </Button>
                  </div>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800" />
                <ScrollArea className="flex-1">
                  <div className="space-y-3 p-4">
                    {chartBlocks.length === 0 ? (
                      <div className="flex h-[280px] flex-col items-center justify-center rounded-md border-zinc-200 text-center text-sm text-zinc-500 dark:border-zinc-800">
                        <div className="mb-1 text-sm font-medium text-zinc-700 dark:text-zinc-200">
                          {t('No charts yet')}
                        </div>
                        <div className="max-w-[520px] px-6">
                          {t(
                            'Use the chat on the right to generate charts or insights.'
                          )}
                        </div>

                        {messages.length === 0 && (
                          <div className="mt-3">
                            <Button
                              size="sm"
                              Icon={LuPlus}
                              onClick={() =>
                                sendMessage({ text: suggestions[0] })
                              }
                            >
                              {t('Try example')}
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : (
                      chartBlocks.map((block) => (
                        <WarehouseChartBlock
                          key={block.id}
                          id={block.id}
                          title={block.title}
                          data={block.data}
                          chartType={block.type}
                          onDelete={(id) =>
                            setChartBlocks((prev) =>
                              prev.filter((b) => b.id !== id)
                            )
                          }
                        />
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>
            <ResizableHandle withHandle />
            <ResizablePanel
              defaultSize={50}
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
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => refreshId()}
                    >
                      {t('New chat')}
                    </Button>
                  </div>
                </div>
                <div className="border-t border-zinc-200 dark:border-zinc-800" />
                <ScrollArea className="flex-1">
                  <Conversation>
                    <ConversationContent>
                      <AIResponseMessages
                        messages={messages}
                        status={status}
                        onAddToolResult={addToolResult}
                      />
                    </ConversationContent>
                    <ConversationScrollButton />
                  </Conversation>

                  {error && (
                    <div className="p-3">
                      <Alert variant="destructive">
                        <LuCircleAlert className="h-4 w-4" />
                        <AlertTitle>{t('An error occurred.')}</AlertTitle>
                        <AlertDescription>{String(error)}</AlertDescription>
                        <div className="mt-2 flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleReset()}
                          >
                            {t('Retry')}
                          </Button>
                        </div>
                      </Alert>
                    </div>
                  )}

                  {usage && status === 'ready' && messages.length > 0 && (
                    <div className="px-4 py-1 text-right text-xs text-opacity-40">
                      {formatNumber(usage.inputTokens + usage.outputTokens)}{' '}
                      tokens used
                    </div>
                  )}
                </ScrollArea>

                <Suggestions className="p-3">
                  {suggestions.map((suggestion) => (
                    <Suggestion
                      key={suggestion}
                      onClick={handleSuggestionClick}
                      suggestion={suggestion}
                    />
                  ))}
                </Suggestions>
                <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="flex items-center gap-2">
                    <Input
                      placeholder={t('Type a message...')}
                      disabled={status !== 'ready'}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                          e.preventDefault();
                          handleSend();
                        }
                      }}
                    />

                    {status === 'ready' || status === 'error' ? (
                      <Button size="icon" Icon={LuSend} onClick={handleSend} />
                    ) : (
                      <Button
                        size="icon"
                        Icon={LuCircleStop}
                        onClick={handleStop}
                      />
                    )}
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
