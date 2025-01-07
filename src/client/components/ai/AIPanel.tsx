import { isDev } from '@/utils/env';
import React, { useState } from 'react';
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { useAIStore } from './store';
import { useTranslation } from '@i18next-toolkit/react';
import { Button } from '../ui/button';
import { LuSend } from 'react-icons/lu';
import { Input } from '../ui/input';
import { cn } from '@/utils/style';
import { ScrollArea } from '../ui/scroll-area';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId, useUserStore } from '@/store/user';
import { MarkdownViewer } from '../MarkdownEditor';

export const AIPanel: React.FC = React.memo(() => {
  const { open, conversation } = useAIStore();
  const { t } = useTranslation();
  const [input, setInput] = useState('');
  const askAIQuestion = useAIStore((state) => state.askAIQuestion);
  const workspaceId = useCurrentWorkspaceId();
  const nickname = useUserStore((state) => state.info?.nickname);

  const handleSend = useEvent(async () => {
    await askAIQuestion(workspaceId, input);
    setInput('');
  });

  if (!isDev) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={(open) => useAIStore.setState({ open })}>
      <SheetContent className="flex flex-1 flex-col sm:max-w-[80vw]">
        <SheetHeader>
          <SheetTitle>{t('AI Assistant')}</SheetTitle>
        </SheetHeader>

        <ScrollArea className="flex flex-1 flex-col gap-2">
          {conversation.map((item, i) => {
            return (
              <div
                key={i}
                className={cn('flex w-full flex-col gap-1', {
                  'items-end': item.role === 'user',
                })}
              >
                <div className="px-2 text-xs opacity-60">
                  {item.role === 'assistant' ? t('AI Assistant') : nickname}
                </div>
                <div className="w-3/4 rounded-lg border border-gray-400 border-opacity-60 px-2 py-1">
                  {item.role === 'assistant' ? (
                    <MarkdownViewer value={item.content} />
                  ) : (
                    <div>{item.content}</div>
                  )}
                </div>
              </div>
            );
          })}
        </ScrollArea>
        <SheetFooter>
          <Input
            className="flex-1 bg-white bg-opacity-10 hover:bg-white hover:bg-opacity-20"
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
          <Button Icon={LuSend} size="icon" onClick={handleSend} />
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
});
AIPanel.displayName = 'AIPanel';
