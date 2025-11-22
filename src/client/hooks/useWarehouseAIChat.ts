import { useState, useMemo } from 'react';
import { useEvent } from '@/hooks/useEvent';
import { useAIChat, ToolCallHandler } from '@/hooks/useAIChat';
import { sleep } from '@tianji/shared';
import { generateRandomString } from '@/utils/common';
import { TimeEventChartType } from '@/components/chart/TimeEventChart';
import { toast } from 'sonner';
import { useTranslation } from '@i18next-toolkit/react';

interface WarehouseScope {
  type: 'database' | 'table';
  id: string;
  name: string;
  databaseId?: string;
}

interface ChartBlock {
  id: string;
  title: string;
  data: Array<Record<string, any>>;
  type: TimeEventChartType;
}

interface UseWarehouseAIChatOptions {
  workspaceId: string;
  selectedScopes: WarehouseScope[];
  isDisabled?: boolean;
}

/**
 * Custom hook for warehouse AI chat functionality
 * Manages chat messages, tool calls, chart blocks, and usage tracking
 */
export function useWarehouseAIChat({
  workspaceId,
  selectedScopes,
  isDisabled = false,
}: UseWarehouseAIChatOptions) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const [chartBlocks, setChartBlocks] = useState<ChartBlock[]>([]);

  // Initialize AI chat with warehouse-specific tool handlers
  const {
    messages,
    sendMessage,
    stop,
    status,
    error,
    addToolResult,
    usage,
    refreshId,
    reset: resetChat,
  } = useAIChat({
    apiEndpoint: `/api/insights/${workspaceId}/chat`,
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

      // Handle createCharts tool call
      if (toolCall.toolName === 'createCharts') {
        try {
          const input = toolCall.input as {
            data?: Array<Record<string, any>>;
            title?: string;
            type?: TimeEventChartType;
          };
          const data = Array.isArray(input.data) ? input.data : [];
          const title = typeof input.title === 'string' ? input.title : 'Chart';
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

    // Actions
    handleSend,
    handleSendWithScopes,
    handleSuggestionClick,
    handleReset,
    handleClearCharts,
    handleDeleteChart,
    refreshId,
  };
}
