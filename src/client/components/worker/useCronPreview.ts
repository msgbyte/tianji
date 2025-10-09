import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { trpc } from '@/api/trpc';
import { useEvent } from '@/hooks/useEvent';

interface UseCronPreviewOptions {
  cronExpression?: string;
  enabled?: boolean;
  count?: number;
  onInvalidExpression?: () => void;
}

interface UseCronPreviewResult {
  previewTimes: string[];
  error: string | null;
  isLoading: boolean;
  validate: () => Promise<void>;
}

export function useCronPreview({
  cronExpression,
  enabled = false,
  count = 5,
  onInvalidExpression,
}: UseCronPreviewOptions): UseCronPreviewResult {
  const [previewTimes, setPreviewTimes] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  const cronPreviewMutation = trpc.global.previewCron.useMutation({
    onSuccess: (data) => {
      const runs = (data.nextRuns ?? []).map((run) =>
        dayjs(run).format('YYYY-MM-DD HH:mm:ss (z)')
      );
      setPreviewTimes(runs);
      setError(null);
    },
    onError: (mutationError) => {
      setPreviewTimes([]);
      setError(mutationError.message);
    },
  });

  useEffect(() => {
    if (!enabled) {
      cronPreviewMutation.reset();
      setPreviewTimes([]);
      setError(null);
      return;
    }

    const expression = cronExpression?.trim();
    if (!expression) {
      cronPreviewMutation.reset();
      setPreviewTimes([]);
      setError(null);
      return;
    }

    setPreviewTimes([]);
    setError(null);
  }, [cronExpression, enabled]);

  const validate = useEvent(async () => {
    const expression = cronExpression?.trim();
    setError(null);

    if (!expression) {
      onInvalidExpression?.();
      return;
    }

    await cronPreviewMutation.mutateAsync({
      cronExpression: expression,
      count,
    });
  });

  return {
    previewTimes,
    error,
    isLoading: cronPreviewMutation.isPending,
    validate,
  };
}
