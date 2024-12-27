import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { useAIStore } from './store';

export function useAIAction() {
  const workspaceId = useCurrentWorkspaceId();

  const askAIQuestion = useEvent(async (question) => {
    await useAIStore.getState().askAIQuestion(workspaceId, question);
  });

  return { askAIQuestion };
}
