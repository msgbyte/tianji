import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { t, useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import { CommonHeader } from '@/components/CommonHeader';
import { useCurrentWorkspaceId } from '@/store/user';
import { trpc } from '@/api/trpc';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { LuPlus, LuDatabase, LuCircleAlert, LuTrash2 } from 'react-icons/lu';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useChat } from '@ai-sdk/react';
import {
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
} from 'ai';
import { useEvent } from '@/hooks/useEvent';
import { useMemo, useReducer, useState, useEffect } from 'react';
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
import {
  PromptInput,
  PromptInputSubmit,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
} from '@/components/ai-elements/prompt-input';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { toast } from 'sonner';

export const Route = createFileRoute('/insights/warehouse/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

const suggestions = [
  t('Show daily revenue for the last 7 days'),
  t('Show daily active users for the last 7 days'),
];

function PageComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const [input, setInput] = useState('');
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const { data: databases } = trpc.insights.warehouse.database.list.useQuery({
    workspaceId,
  });
  const { data: tables } = trpc.insights.warehouse.table.list.useQuery({
    workspaceId,
  });
  const [selectedScopes, setSelectedScopes] = useState<
    Array<{
      type: 'database' | 'table';
      id: string;
      name: string;
      databaseId?: string;
    }>
  >([]);
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

  // Initialize with first database if available
  useEffect(() => {
    if (databases && databases.length > 0 && selectedScopes.length === 0) {
      const firstDb = databases[0];
      setSelectedScopes([
        {
          type: 'database',
          id: firstDb.id,
          name: firstDb.name,
        },
      ]);
    }
  }, [databases]);

  // Check database availability and cross-database conflicts
  const databaseStatus = useMemo(() => {
    const hasNoDatabases = !databases || databases.length === 0;

    const databaseIds = new Set<string>();
    // Add directly selected databases
    selectedScopes.forEach((scope) => {
      if (scope.type === 'database') {
        databaseIds.add(scope.id);
      }
    });
    // Add databases from selected tables
    selectedScopes.forEach((scope) => {
      if (scope.type === 'table' && scope.databaseId) {
        databaseIds.add(scope.databaseId);
      }
    });

    const isMultiDatabase = databaseIds.size > 1;
    const hasNoActiveScopes = databaseIds.size === 0;
    const isDisabled = hasNoDatabases || hasNoActiveScopes || isMultiDatabase;

    return {
      hasNoDatabases,
      isMultiDatabase,
      hasNoActiveScopes,
      isDisabled,
    };
  }, [databases, selectedScopes]);

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

  const handleSend = useEvent(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!input.trim() || databaseStatus.isDisabled) {
      const message = databaseStatus.hasNoDatabases
        ? t('Please configure a database first')
        : databaseStatus.isMultiDatabase
          ? t('Please select tables from a single database')
          : t('Please configure a database first');

      toast.warning(message);
      return;
    }

    await handleSendWithScopes(input.trim());
    setInput('');
  });

  const handleSendWithScopes = useEvent(async (text: string) => {
    await sendMessage({
      text,
      metadata: {
        scopes: selectedScopes,
      },
    });
  });

  const handleNavigateToConnections = useEvent(() => {
    navigate({ to: '/insights/warehouse/connections' });
  });

  const handleSuggestionClick = useEvent(async (suggestion: string) => {
    await handleSendWithScopes(suggestion);
  });

  const handleReset = useEvent(() => {
    refreshId();
    setUsage(null);
  });

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={
            <div className="flex items-center gap-2">
              <div>{t('Warehouse')}</div>
            </div>
          }
          actions={
            <Button
              size="sm"
              variant="default"
              Icon={LuDatabase}
              onClick={handleNavigateToConnections}
            >
              {t('Connections')}
            </Button>
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
                            onClick={() => handleSendWithScopes(suggestions[0])}
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
                  <Button
                    size="sm"
                    variant="outline"
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

              {!databaseStatus.isDisabled && (
                <Suggestions className="p-3 pb-0">
                  {suggestions.map((suggestion) => (
                    <Suggestion
                      key={suggestion}
                      onClick={handleSuggestionClick}
                      suggestion={suggestion}
                    />
                  ))}
                </Suggestions>
              )}

              <div className="p-3">
                {databaseStatus.hasNoDatabases && (
                  <Alert className="mb-3">
                    <LuCircleAlert className="h-4 w-4" />
                    <AlertTitle>{t('No databases configured')}</AlertTitle>
                    <AlertDescription>
                      <div>
                        {t('Please configure a database connection first.')}
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="mt-2"
                        onClick={handleNavigateToConnections}
                      >
                        {t('Configure Database')}
                      </Button>
                    </AlertDescription>
                  </Alert>
                )}

                {!databaseStatus.hasNoDatabases &&
                  databaseStatus.hasNoActiveScopes && (
                    <Alert className="mb-3">
                      <LuCircleAlert className="h-4 w-4" />
                      <AlertTitle>
                        {t('No database or table selected')}
                      </AlertTitle>
                      <AlertDescription>
                        {t(
                          'Please select a database or table to start querying.'
                        )}
                      </AlertDescription>
                    </Alert>
                  )}

                {databaseStatus.isMultiDatabase && (
                  <Alert variant="destructive" className="mb-3">
                    <LuCircleAlert className="h-4 w-4" />
                    <AlertTitle>
                      {t('Cross-database query disabled')}
                    </AlertTitle>
                    <AlertDescription>
                      {t(
                        'Cannot query across multiple databases simultaneously.'
                      )}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="mb-2">
                  {selectedScopes.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {selectedScopes.map((s) => (
                        <Badge
                          key={`${s.type}-${s.id}`}
                          variant="secondary"
                          className="gap-1"
                        >
                          {s.type === 'database' ? t('DB') : t('Table')}:{' '}
                          {s.name}
                          <button
                            type="button"
                            className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded hover:bg-zinc-200 dark:hover:bg-zinc-700"
                            onClick={() =>
                              setSelectedScopes((prev) =>
                                prev.filter(
                                  (p) => !(p.type === s.type && p.id === s.id)
                                )
                              )
                            }
                            aria-label={t('Remove')}
                          >
                            ×
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>

                <PromptInput onSubmit={handleSend}>
                  <PromptInputTextarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    disabled={databaseStatus.isDisabled}
                    placeholder={
                      databaseStatus.hasNoDatabases
                        ? t('Please configure a database first')
                        : databaseStatus.isMultiDatabase
                          ? t('Please select tables from a single database')
                          : ''
                    }
                  />
                  <PromptInputToolbar>
                    <PromptInputTools>
                      <Popover open={open} onOpenChange={setOpen}>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            size="icon"
                            Icon={LuDatabase}
                          />
                        </PopoverTrigger>
                        <PopoverContent className="w-[420px] p-0" align="start">
                          <Command>
                            <CommandInput placeholder="Filter status..." />
                            <CommandList>
                              <CommandEmpty>
                                {t('No connection found')}
                              </CommandEmpty>
                              <CommandGroup heading={t('Databases')}>
                                {databases?.map((db) => (
                                  <CommandItem
                                    key={db.id}
                                    value={db.id}
                                    keywords={[db.name]}
                                    onSelect={() => {
                                      setSelectedScopes((prev) => {
                                        const isChecked = prev.some(
                                          (p) =>
                                            p.type === 'database' &&
                                            p.id === db.id
                                        );
                                        if (isChecked) {
                                          return prev.filter(
                                            (p) =>
                                              !(
                                                p.type === 'database' &&
                                                p.id === db.id
                                              )
                                          );
                                        } else {
                                          return [
                                            ...prev,
                                            {
                                              type: 'database',
                                              id: db.id,
                                              name: db.name,
                                            },
                                          ];
                                        }
                                      });
                                      setOpen(false);
                                    }}
                                  >
                                    {db.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>

                              <CommandGroup heading={t('Tables')}>
                                {tables?.map((tb) => (
                                  <CommandItem
                                    key={tb.id}
                                    value={tb.id}
                                    keywords={[tb.name]}
                                    onSelect={() => {
                                      setSelectedScopes((prev) => {
                                        const isChecked = prev.some(
                                          (p) =>
                                            p.type === 'table' && p.id === tb.id
                                        );

                                        if (isChecked) {
                                          return prev.filter(
                                            (p) =>
                                              !(
                                                p.type === 'table' &&
                                                p.id === tb.id
                                              )
                                          );
                                        } else {
                                          return [
                                            ...prev,
                                            {
                                              type: 'table',
                                              id: tb.id,
                                              name: tb.name,
                                              databaseId: tb.databaseId,
                                            },
                                          ];
                                        }
                                      });
                                      setOpen(false);
                                    }}
                                  >
                                    {tb.name}
                                  </CommandItem>
                                ))}
                              </CommandGroup>
                            </CommandList>
                          </Command>
                        </PopoverContent>
                      </Popover>
                    </PromptInputTools>
                    <PromptInputSubmit
                      disabled={!input || databaseStatus.isDisabled}
                      status={status}
                    />
                  </PromptInputToolbar>
                </PromptInput>
              </div>
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </CommonWrapper>
  );
}
