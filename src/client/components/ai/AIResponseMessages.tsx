import { AbstractChat, ChatStatus, UIDataTypes, UIMessage, UITools } from 'ai';
import React from 'react';
import { Message, MessageContent } from '../ai-elements/message';
import { AIResponseItem } from './AIResponseItem';
import { Spinner } from '../ui/spinner';

interface AIResponseMessagesProps {
  messages: UIMessage<unknown, UIDataTypes, UITools>[];
  status: ChatStatus;
  onAddToolResult: (
    result: Parameters<AbstractChat<UIMessage>['addToolResult']>[0]
  ) => void;
}
export const AIResponseMessages: React.FC<AIResponseMessagesProps> = React.memo(
  (props) => {
    const { messages, status, onAddToolResult } = props;

    return (
      <>
        {messages.map((message) => (
          <Message from={message.role} key={message.id}>
            <MessageContent>
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
        ))}

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
