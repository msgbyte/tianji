import { AbstractChat, ChatStatus, UIDataTypes, UIMessage, UITools } from 'ai';
import React, { Fragment } from 'react';
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
} from '../ai-elements/message';
import { AIResponseItem } from './AIResponseItem';
import { Spinner } from '../ui/spinner';
import { LuCopy, LuRefreshCcw } from 'react-icons/lu';
import { toast } from 'sonner';
import { useTranslation } from '@i18next-toolkit/react';

interface AIResponseMessagesProps {
  messages: UIMessage<unknown, UIDataTypes, UITools>[];
  status: ChatStatus;
  onRegenerate?: () => void;
  onAddToolResult: (
    result: Parameters<AbstractChat<UIMessage>['addToolResult']>[0]
  ) => void;
}
export const AIResponseMessages: React.FC<AIResponseMessagesProps> = React.memo(
  (props) => {
    const { messages, status, onRegenerate, onAddToolResult } = props;
    const { t } = useTranslation();

    return (
      <>
        {messages.map((message, messageIndex) => {
          const isLastMessage = messageIndex === messages.length - 1;

          return (
            <Fragment key={message.id}>
              <Message from={message.role}>
                <MessageContent
                  className={message.role === 'assistant' ? 'w-full' : 'w-auto'}
                >
                  {message.parts.map((part, i) => (
                    <AIResponseItem
                      key={`${message.id}-${i}`}
                      message={message}
                      part={part}
                      status={status}
                      onAddToolResult={onAddToolResult}
                    />
                  ))}
                </MessageContent>
              </Message>

              {message.role === 'assistant' &&
                isLastMessage &&
                ['ready', 'error'].includes(status) && (
                  <MessageActions>
                    <MessageAction onClick={onRegenerate} label="Retry">
                      <LuRefreshCcw className="size-3" />
                    </MessageAction>
                    <MessageAction
                      onClick={() => {
                        navigator.clipboard.writeText(
                          message.parts
                            .filter((p) => p.type === 'text')
                            .map((p) => p.text)
                            .join('\n')
                        );
                        toast.success(t('Copied'));
                      }}
                      label="Copy"
                    >
                      <LuCopy className="size-3" />
                    </MessageAction>
                  </MessageActions>
                )}
            </Fragment>
          );
        })}

        {status === 'submitted' && (
          <Message from="assistant">
            <MessageContent>
              <Spinner />
            </MessageContent>
          </Message>
        )}
      </>
    );
  }
);
AIResponseMessages.displayName = 'AIResponseMessages';
