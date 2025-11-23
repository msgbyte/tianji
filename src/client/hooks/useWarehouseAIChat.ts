import { useState, useMemo, useEffect } from 'react';
import { useEvent } from '@/hooks/useEvent';
import { useAIChat, ToolCallHandler } from '@/hooks/useAIChat';
import { useWarehouseSessionStorage } from '@/hooks/useWarehouseSessionStorage';
import { sleep } from '@tianji/shared';
import { generateRandomString } from '@/utils/common';
import { toast } from 'sonner';
import { useTranslation } from '@i18next-toolkit/react';
import { useGlobalEventSubscribe } from '@/utils/event';
import { InsightsTimeEventChartProps } from '@/components/insights/InsightsTimeEventChart';

export interface WarehouseScope {
  type: 'database' | 'table';
  id: string;
  name: string;
  databaseId?: string;
}

type ChartBlock = InsightsTimeEventChartProps & {
  id: string;
  title: string;
};

interface UseWarehouseAIChatOptions {
  workspaceId: string;
  selectedScopes: WarehouseScope[];
  isDisabled?: boolean;
}

/**
 * Custom hook for warehouse AI chat functionality
 * Manages chat messages, tool calls, chart blocks, and usage tracking
 * Includes automatic persistence to localStorage
 */
export function useWarehouseAIChat({
  workspaceId,
  selectedScopes,
  isDisabled = false,
}: UseWarehouseAIChatOptions) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  // Initialize persistence storage
  const {
    session,
    saveMessages,
    saveChartBlocks,
    saveSelectedScopes,
    clearSession,
  } = useWarehouseSessionStorage(workspaceId);

  // Initialize chartBlocks from storage or empty array
  const [chartBlocks, _setChartBlocks] = useState<ChartBlock[]>(
    session?.chartBlocks ?? []
  );

  // Wrapped setter for chartBlocks that triggers save
  const setChartBlocks = useEvent(
    (newChartBlocks: ChartBlock[] | ((prev: ChartBlock[]) => ChartBlock[])) => {
      _setChartBlocks((prev) => {
        const updated =
          typeof newChartBlocks === 'function'
            ? newChartBlocks(prev)
            : newChartBlocks;
        saveChartBlocks(updated);
        return updated;
      });
    }
  );

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
    initialMessages: session?.messages ?? [],
    onMessagesUpdate: (messages) => {
      // Save messages when AI response finishes
      if (messages.length > 0) {
        saveMessages(messages);
      }
    },
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
    },
  });

  useGlobalEventSubscribe('createInsightChartBlock', (title, chartBlock) => {
    setChartBlocks((prev) => [
      {
        id: generateRandomString(8),
        title,
        ...chartBlock,
      },
      ...prev,
    ]);
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

  // Clear all chart blocks
  const handleClearCharts = useEvent(() => {
    setChartBlocks([]);
  });

  // Delete a specific chart block
  const handleDeleteChart = useEvent((id: string) => {
    setChartBlocks((prev) => prev.filter((b) => b.id !== id));
  });

  // Wrapped refreshId that also clears storage
  const refreshId = useEvent(() => {
    clearSession();
    _setChartBlocks([]);
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

    // Chart blocks
    chartBlocks,

    // Usage tracking
    usage,

    // Persisted data
    savedSelectedScopes: session?.selectedScopes ?? [],
    saveSelectedScopes, // Expose save function for manual save

    // Actions
    handleSend,
    handleSendWithScopes,
    handleSuggestionClick,
    handleReset,
    handleRegenerate: regenerateChat,
    handleClearCharts,
    handleDeleteChart,
    refreshId,
  };
}
