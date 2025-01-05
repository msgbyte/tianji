import { trpcClientProxy } from '@/api/trpc';
import { last } from 'lodash-es';
import { create } from 'zustand';
import { immer } from 'zustand/middleware/immer';
import { get as _get } from 'lodash-es';

interface ConversationMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AIStoreState {
  open: boolean;
  conversation: ConversationMessage[];
  context: any;
  askAIQuestion: (workspaceId: string, question: string) => Promise<void>;
  appendUserResponse: (question: string) => void;
  appendAssistantResponse: (responseText: string) => void;
}

export const useAIStore = create<AIStoreState>()(
  immer((set, get) => ({
    open: false,
    conversation: [],
    context: {
      type: 'unknown',
    },
    askAIQuestion: async (workspaceId: string, question: string) => {
      const { appendUserResponse, appendAssistantResponse, context } = get();
      appendUserResponse(question);
      const iterable = (await trpcClientProxy.ai.ask.query(
        {
          workspaceId,
          question,
          context,
        },
        {
          context: {
            stream: true,
          },
        }
      )) as AsyncGenerator<any>;

      for await (const value of iterable) {
        appendAssistantResponse(_get(value, 'content', ''));
      }
    },
    appendUserResponse: (question: string) => {
      set((state) => {
        state.open = true;
        state.conversation.push({
          role: 'user',
          content: question,
        });
      });
    },
    appendAssistantResponse: (responseText: string) => {
      set((state) => {
        if (last(state.conversation)?.role === 'assistant') {
          state.conversation[state.conversation.length - 1].content +=
            responseText;
        } else {
          state.conversation.push({
            role: 'assistant',
            content: responseText,
          });
        }
      });
    },
  }))
);
