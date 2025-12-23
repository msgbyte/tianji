import { useState } from 'react';
import { useEvent } from '@/hooks/useEvent';
import { useAIChat, ToolCallHandler } from '@/hooks/useAIChat';
import { toast } from 'sonner';
import { useTranslation } from '@i18next-toolkit/react';
import { get } from 'lodash-es';
import { SelectedElementInfo } from '@/components/page/HtmlEditorAIChatPanel';

interface UseHtmlEditorAIChatOptions {
  workspaceId: string;
  currentHtmlCode: string | null;
  selectedElement: SelectedElementInfo | null;
  onHtmlGenerated?: (html: string) => void;
  onSelectionCleared?: () => void;
}

export function useHtmlEditorAIChat({
  workspaceId,
  currentHtmlCode,
  selectedElement,
  onHtmlGenerated,
  onSelectionCleared,
}: UseHtmlEditorAIChatOptions) {
  const { t } = useTranslation();
  const [input, setInput] = useState('');

  // Initialize AI chat with HTML editor-specific tool handlers
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
    apiEndpoint: `/api/page/${workspaceId}/chat`,
    transportOptions: {
      body: {},
    },
    initialMessages: [],
    async onToolCall({ toolCall }: Parameters<ToolCallHandler>[0]) {
      // Handle generateHtml tool call
      if (toolCall.toolName === 'generateHtml') {
        const html = get(toolCall.input, 'html');
        const description = get(toolCall.input, 'description');

        if (typeof html === 'string') {
          onHtmlGenerated?.(html);
          toast.success(t('HTML generated successfully'));
        }

        addToolResult({
          tool: 'generateHtml',
          toolCallId: toolCall.toolCallId,
          output: description || 'HTML generated',
        });
      }

      // Handle modifyHtml tool call
      if (toolCall.toolName === 'modifyHtml') {
        const html = get(toolCall.input, 'html');
        const changes = get(toolCall.input, 'changes');

        if (typeof html === 'string') {
          onHtmlGenerated?.(html);
          toast.success(t('HTML modified successfully'));
        }

        addToolResult({
          tool: 'modifyHtml',
          toolCallId: toolCall.toolCallId,
          output: changes || 'HTML modified',
        });
      }

      // Handle explainCode tool call
      if (toolCall.toolName === 'explainCode') {
        const explanation = get(toolCall.input, 'explanation');

        addToolResult({
          tool: 'explainCode',
          toolCallId: toolCall.toolCallId,
          output: explanation || 'Code explained',
        });
      }
    },
  });

  // Send message with current HTML code and selected element as context
  const handleSendWithContext = useEvent(
    async (text: string, clearSelection: boolean = false) => {
      // Capture current selected element before clearing
      const currentSelectedElement = selectedElement;

      // Clear selection immediately before sending if requested
      if (clearSelection && onSelectionCleared) {
        onSelectionCleared();
      }

      await sendMessage({
        text,
        metadata: {
          currentHtmlCode,
          selectedElement: currentSelectedElement,
        },
      });
    }
  );

  // Handle form submission
  const handleSend = useEvent(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (status === 'streaming') {
      stop();
      return;
    }

    if (!input.trim()) {
      return;
    }

    const text = input.trim();
    setInput('');
    try {
      await handleSendWithContext(text, true); // Clear selection after sending
    } catch (err) {
      toast.error(String(err));
      setInput(text);
    }
  });

  // Handle suggestion click
  const handleSuggestionClick = useEvent(async (suggestion: string) => {
    await handleSendWithContext(suggestion, true); // Clear selection after sending
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
    handleSendWithContext,
    handleSuggestionClick,
    handleReset,
    handleRegenerate: regenerateChat,
    refreshId,
  };
}
