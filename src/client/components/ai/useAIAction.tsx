import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { useAIStore } from './store';
import { toast } from 'sonner';
import { useTranslation } from '@i18next-toolkit/react';

export function useAIAction() {
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();

  const askAIQuestion = useEvent(async (question) => {
    const { isBusy, askAIQuestion } = useAIStore.getState();

    if (isBusy) {
      toast(t('AI is busy.'));
    }

    await askAIQuestion(workspaceId, question);
  });

  return { askAIQuestion };
}
