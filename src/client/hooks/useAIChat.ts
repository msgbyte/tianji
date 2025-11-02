import { useChat } from '@ai-sdk/react';
import {
  ChatInit,
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  UIMessage,
} from 'ai';
import { useMemo, useState, useReducer } from 'react';
import { generateRandomString } from '@/utils/common';

interface UsageData {
  cachedInputTokens: number;
  inputTokens: number;
  outputTokens: number;
  reasoningTokens: number;
  totalTokens: number;
}

/**
 * Type for tool call handler
 */
export type ToolCallHandler = NonNullable<ChatInit<UIMessage>['onToolCall']>;

interface UseAIChatOptions {
  /**
   * API endpoint for the chat
   */
  apiEndpoint: string;

  /**
   * Custom tool call handler
   */
  onToolCall?: ToolCallHandler;

  /**
   * Additional chat options
   */
  chatOptions?: Partial<ChatInit<UIMessage>>;

  /**
   * Whether to send automatically when assistant message is complete with tool calls
   * @default true
   */
  sendAutomatically?: boolean;
}

/**
 * Generic hook for AI chat functionality
 * Handles chat transport, message management, and usage tracking
 */
export function useAIChat({
  apiEndpoint,
  onToolCall,
  chatOptions = {},
  sendAutomatically = true,
}: UseAIChatOptions) {
  const [usage, setUsage] = useState<UsageData | null>(null);

  // Generate unique chat session ID
  const [id, refreshId] = useReducer(
    () => generateRandomString(14),
    '',
    () => generateRandomString(14)
  );

  // Create chat transport
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: apiEndpoint,
      }),
    [apiEndpoint]
  );

  // Initialize chat with AI SDK
  const chatResult = useChat({
    id,
    transport,
    sendAutomaticallyWhen: sendAutomatically
      ? lastAssistantMessageIsCompleteWithToolCalls
      : undefined,
    ...chatOptions,
    onToolCall,
    onData(data) {
      // Track usage data
      if (data.type === 'data-usage') {
        setUsage(data.data as any);
      }

      // Call custom onData handler if provided
      chatOptions.onData?.(data);
    },
  });

  const resetUsage = () => {
    setUsage(null);
  };

  const reset = () => {
    refreshId();
    resetUsage();
  };

  return {
    ...chatResult,
    id,
    usage,
    refreshId,
    reset,
    resetUsage,
  };
}
