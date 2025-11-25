import { useState } from 'react';
import { useEvent } from '@/hooks/useEvent';
import { useAIChat, ToolCallHandler } from '@/hooks/useAIChat';
import { sleep } from '@tianji/shared';
import { toast } from 'sonner';
import { useTranslation } from '@i18next-toolkit/react';
import { get } from 'lodash-es';

export interface WarehouseSqlScope {
  type: 'database' | 'table';
  id: string;
  name: string;
  databaseId?: string;
}

interface UseWarehouseSqlChatOptions {
  workspaceId: string;
  selectedScopes: WarehouseSqlScope[];
  isDisabled?: boolean;
  currentSelectedSql: string | null;
  onSQLGenerated?: (sql: string) => void;
}

export function useWarehouseSqlChat({
  workspaceId,
  selectedScopes,
  isDisabled = false,
  currentSelectedSql,
  onSQLGenerated,
}: UseWarehouseSqlChatOptions) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  // Initialize AI chat with warehouse-specific tool handlers
  const {
    messages,
    sendMessage,
    stop,
    status,
    error,
    addToolResult,
    usage,
    refreshId: _refreshId,
    reset: resetChat,
    regenerate: regenerateChat,
  } = useAIChat({
    apiEndpoint: `/api/insights/${workspaceId}/chat`,
    transportOptions: {
      body: {
        toolType: 'sql',
        // its looks like not working, need to find a way to make it update after changed
        // systemPrompt: `User current selecte sql is: ${currentSelectedSql}`,
      },
    },
    initialMessages: [],
    async onToolCall({ toolCall }: Parameters<ToolCallHandler>[0]) {
      // Handle getLocation tool call (demo tool)
      if (toolCall.toolName === 'getLocation') {
        const cities = ['New York', 'Los Angeles', 'Chicago', 'San Francisco'];

        await sleep(2000);

        addToolResult({
          tool: 'getLocation',
          toolCallId: toolCall.toolCallId,
          output: cities[Math.floor(Math.random() * cities.length)],
        });
      }

      if (toolCall.toolName === 'generateSql') {
        const sql = get(toolCall.input, 'sql');
        if (typeof sql === 'string') {
          onSQLGenerated?.(sql);
        }

        addToolResult({
          tool: 'generateSql',
          toolCallId: toolCall.toolCallId,
          output: 'Success',
        });
      }
    },
  });

  // Send message with scopes
  const handleSendWithScopes = useEvent(async (text: string) => {
    await sendMessage({
      text,
      metadata: {
        scopes: selectedScopes,
      },
    });
  });

  // Handle form submission
  const handleSend = useEvent(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (status === 'streaming') {
      stop();
      return;
    }

    if (!input.trim() || isDisabled) {
      toast.warning(t('Please configure a database first'));
      return;
    }

    const text = input.trim();
    setInput('');
    try {
      await handleSendWithScopes(text);
    } catch (err) {
      toast.error(String(err));
      setInput(text);
    }
  });

  // Handle suggestion click
  const handleSuggestionClick = useEvent(async (suggestion: string) => {
    await handleSendWithScopes(suggestion);
  });

  // Reset chat session
  const handleReset = useEvent(() => {
    resetChat();
  });

  // Wrapped refreshId that also clears storage
  const refreshId = useEvent(() => {
    _refreshId();
  });

  return {
    // Input state
    input,
    setInput,

    // Chat state
    messages,
    status,
    error,
    addToolResult,
    stop,

    // Usage tracking
    usage,

    // Actions
    handleSend,
    handleSendWithScopes,
    handleSuggestionClick,
    handleReset,
    handleRegenerate: regenerateChat,
    refreshId,
  };
}
