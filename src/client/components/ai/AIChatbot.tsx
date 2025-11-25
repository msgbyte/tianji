import React from 'react';
import { LuCircleAlert } from 'react-icons/lu';
import { SimpleContextUsage } from '../ai-elements/context';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '../ai-elements/conversation';
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputToolbar,
  PromptInputTools,
  PromptInputSubmit,
} from '../ai-elements/prompt-input';
import { Suggestions, Suggestion } from '../ai-elements/suggestion';
import { AlertTitle, AlertDescription, Alert } from '../ui/alert';
import { AIResponseMessages } from './AIResponseMessages';
import { AbstractChat, ChatStatus, LanguageModelUsage, UIMessage } from 'ai';
import { useTranslation } from '@i18next-toolkit/react';
import { useGlobalConfig } from '@/hooks/useConfig';
import { Button } from '../ui/button';
import { cn } from '@/utils/style';

interface AIChatbotProps {
  className?: string;
  messages: UIMessage[];
  status: ChatStatus;
  error?: Error;
  input: string;
  setInput: (input: string) => void;
  placeholder?: string;
  usage?: LanguageModelUsage;
  isDisabled?: boolean;
  suggestions?: string[];
  alert?: React.ReactNode;
  selectedContext?: React.ReactNode;
  tools?: React.ReactNode;
  onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
  onReset?: () => void;
  onRegenerate?: () => void;
  onSuggestionClick?: (suggestion: string) => void;
  onAddToolResult: (
    result: Parameters<AbstractChat<UIMessage>['addToolResult']>[0]
  ) => void;
}
export const AIChatbot: React.FC<AIChatbotProps> = React.memo((props) => {
  const { t } = useTranslation();
  const { ai } = useGlobalConfig();

  return (
    <div className={cn('flex flex-col', props.className)}>
      <Conversation>
        <ConversationContent className="space-y-2">
          <AIResponseMessages
            messages={props.messages}
            status={props.status}
            onRegenerate={props.onRegenerate}
            onAddToolResult={props.onAddToolResult}
          />
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      {props.error && (
        <div className="p-3">
          <Alert variant="destructive">
            <LuCircleAlert className="h-4 w-4" />
            <AlertTitle>{t('An error occurred.')}</AlertTitle>
            <AlertDescription>{String(props.error)}</AlertDescription>
            <div className="mt-2 flex items-center gap-2">
              <Button size="sm" variant="destructive" onClick={props.onReset}>
                {t('Retry')}
              </Button>
            </div>
          </Alert>
        </div>
      )}

      {!props.isDisabled && (
        <Suggestions className="p-3 pb-0">
          {(props.suggestions ?? []).map((suggestion) => (
            <Suggestion
              key={suggestion}
              onClick={props.onSuggestionClick}
              suggestion={suggestion}
            />
          ))}
        </Suggestions>
      )}

      <div className="p-3">
        {props.alert}

        {props.selectedContext}

        {props.usage &&
          props.status === 'ready' &&
          props.messages.length > 0 && (
            <div className="relative">
              <div className="absolute -top-10 right-0 px-4 py-1 text-right text-xs text-opacity-40">
                <SimpleContextUsage
                  maxTokens={ai.contextWindow}
                  usage={props.usage}
                  usedTokens={props.usage.totalTokens ?? 0}
                />
              </div>
            </div>
          )}

        <PromptInput onSubmit={props.onSubmit}>
          <PromptInputTextarea
            value={props.input}
            onChange={(e) => props.setInput(e.target.value)}
            disabled={props.isDisabled}
            placeholder={props.placeholder}
          />
          <PromptInputToolbar>
            <PromptInputTools>{props.tools}</PromptInputTools>
            <PromptInputSubmit
              disabled={
                !props.input &&
                ['ready', 'submitted', 'error'].includes(props.status)
              }
              status={props.status}
            />
          </PromptInputToolbar>
        </PromptInput>
      </div>
    </div>
  );
});
AIChatbot.displayName = 'AIChatbot';
