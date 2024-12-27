import { isDev } from '@/utils/env';
import React from 'react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { useAIStore } from './store';
import { useTranslation } from '@i18next-toolkit/react';

export const AIPanel: React.FC = React.memo(() => {
  const { open, conversation } = useAIStore();
  const { t } = useTranslation();

  if (!isDev) {
    return null;
  }

  return (
    <Sheet open={open} onOpenChange={(open) => useAIStore.setState({ open })}>
      <SheetContent>
        <SheetHeader>
          <SheetTitle>{t('AI Assistant')}</SheetTitle>
          <SheetDescription>
            {conversation.map((item, i) => {
              return (
                <div key={i}>
                  {item.role}: {item.content}
                </div>
              );
            })}
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
});
AIPanel.displayName = 'AIPanel';
