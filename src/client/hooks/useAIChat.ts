import { useChat } from '@ai-sdk/react';
import {
  ChatInit,
  DefaultChatTransport,
  lastAssistantMessageIsCompleteWithToolCalls,
  UIMessage,
} from 'ai';
import { useMemo, useState, useReducer, useEffect, useRef } from 'react';
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
   * Initial messages to load
   */
  initialMessages?: UIMessage[];

  /**
   * Callback when messages are updated
   */
  onMessagesUpdate?: (messages: UIMessage[]) => void;

  /**
   * Additional chat options
   */
  chatOptions?: Omit<Partial<ChatInit<UIMessage>>, 'onToolCall'>;

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
  initialMessages,
  onMessagesUpdate,
  chatOptions = {},
  sendAutomatically = true,
}: UseAIChatOptions) {
  const [usage, setUsage] = useState<UsageData | null>(null);
  const prevStatusRef = useRef<string>('ready');

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
    ...(initialMessages && initialMessages.length > 0
      ? { messages: initialMessages }
      : {}),
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
    onFinish(data) {
      // Call custom onFinish handler if provided
      chatOptions.onFinish?.(data);
    },
  });

  // Save messages when streaming completes (status changes from streaming -> ready)
  useEffect(() => {
    if (prevStatusRef.current !== 'ready' && chatResult.status === 'ready') {
      if (chatResult.messages.length > 0) {
        onMessagesUpdate?.(chatResult.messages);
      }
    }
    prevStatusRef.current = chatResult.status;
  }, [chatResult.status, chatResult.messages, onMessagesUpdate]);

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
