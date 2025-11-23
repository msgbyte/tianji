import { useLocalStorageState } from 'ahooks';
import { UIMessage } from 'ai';
import { useCallback } from 'react';
import { type WarehouseScope } from './useWarehouseAIChat';
import { InsightsTimeEventChartProps } from '@/components/insights/InsightsTimeEventChart';

type ChartBlock = InsightsTimeEventChartProps & {
  id: string;
  title: string;
};

interface StoredSession {
  messages: UIMessage[];
  chartBlocks: ChartBlock[];
  selectedScopes: WarehouseScope[];
  updatedAt: number;
}

interface UseWarehouseSessionStorageReturn {
  session: StoredSession | null | undefined;
  saveMessages: (messages: UIMessage[]) => void;
  saveChartBlocks: (chartBlocks: ChartBlock[]) => void;
  saveSelectedScopes: (scopes: WarehouseScope[]) => void;
  saveSession: (data: Partial<Omit<StoredSession, 'updatedAt'>>) => void;
  clearSession: () => void;
}

/**
 * Hook for managing warehouse chat session persistence in localStorage
 * Stores messages, chart blocks, and selected database/table scopes
 */
export function useWarehouseSessionStorage(
  workspaceId: string
): UseWarehouseSessionStorageReturn {
  const storageKey = `warehouse-chat-${workspaceId}`;

  const [session, setSession] = useLocalStorageState<StoredSession | null>(
    storageKey,
    {
      defaultValue: null,
      serializer: (value) => JSON.stringify(value),
      deserializer: (value) => {
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      },
    }
  );

  const saveSession = useCallback(
    (data: Partial<Omit<StoredSession, 'updatedAt'>>) => {
      setSession((prev) => {
        const currentSession = prev ?? {
          messages: [],
          chartBlocks: [],
          selectedScopes: [],
          updatedAt: Date.now(),
        };
        return {
          ...currentSession,
          ...data,
          updatedAt: Date.now(),
        };
      });
    },
    [setSession]
  );

  const saveMessages = useCallback(
    (messages: UIMessage[]) => {
      saveSession({ messages });
    },
    [saveSession]
  );

  const saveChartBlocks = useCallback(
    (chartBlocks: ChartBlock[]) => {
      saveSession({ chartBlocks });
    },
    [saveSession]
  );

  const saveSelectedScopes = useCallback(
    (selectedScopes: WarehouseScope[]) => {
      saveSession({ selectedScopes });
    },
    [saveSession]
  );

  const clearSession = useCallback(() => {
    setSession(null);
  }, [setSession]);

  return {
    session,
    saveMessages,
    saveChartBlocks,
    saveSelectedScopes,
    saveSession,
    clearSession,
  };
}
