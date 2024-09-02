import React, { useMemo } from 'react';
import { Button } from '../ui/button';
import { LuArchive, LuArchiveRestore } from 'react-icons/lu';
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover';
import { AppRouterOutput, trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { DynamicVirtualList } from '../DynamicVirtualList';
import { get } from 'lodash-es';
import { FeedEventItem } from './FeedEventItem';
import { useTranslation } from '@i18next-toolkit/react';
import { Separator } from '../ui/separator';
import { useEvent } from '@/hooks/useEvent';
import { toast } from 'sonner';
import { AlertConfirm } from '../AlertConfirm';

type FeedItem = AppRouterOutput['feed']['fetchEventsByCursor']['items'][number];

interface FeedArchivePageButtonProps {
  channelId: string;
}

export const FeedArchivePageButton: React.FC<FeedArchivePageButtonProps> =
  React.memo((props) => {
    const workspaceId = useCurrentWorkspaceId();
    const channelId = props.channelId;
    const { t } = useTranslation();
    const unarchiveEventMutation = trpc.feed.unarchiveEvent.useMutation();
    const clearAllArchivedEventsMutation =
      trpc.feed.clearAllArchivedEvents.useMutation();
    const trpcUtils = trpc.useUtils();

    const {
      data,
      isInitialLoading,
      hasNextPage,
      fetchNextPage,
      isFetchingNextPage,
    } = trpc.feed.fetchEventsByCursor.useInfiniteQuery(
      {
        workspaceId,
        channelId,
        archived: true,
      },
      {
        refetchOnMount: false,
        refetchOnWindowFocus: false,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

    const handleUnArchive = useEvent(async (event: FeedItem) => {
      await unarchiveEventMutation.mutateAsync({
        workspaceId,
        channelId,
        eventId: event.id,
      });
      trpcUtils.feed.fetchEventsByCursor.refetch();
      toast.success(t('Event unarchived'));
    });

    const handleClear = useEvent(async () => {
      const count = await clearAllArchivedEventsMutation.mutateAsync({
        workspaceId,
        channelId,
      });
      trpcUtils.feed.fetchEventsByCursor.refetch();
      toast.success(t('{{num}} events cleared', { num: count }));
    });

    const fullEvents = useMemo(
      () => data?.pages.flatMap((p) => p.items) ?? [],
      [data]
    );

    return (
      <Popover>
        <PopoverTrigger>
          <Button size="icon" variant="outline">
            <LuArchive />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="flex h-[50vh] w-96 flex-col overflow-hidden"
          side="bottom"
          align="end"
        >
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold">{t('Archived Events')}</h1>

            <AlertConfirm onConfirm={handleClear}>
              <Button size="sm">{t('Clear')}</Button>
            </AlertConfirm>
          </div>

          <Separator className="my-2" />

          <div className="flex-1">
            <DynamicVirtualList
              allData={fullEvents}
              estimateSize={100}
              hasNextPage={hasNextPage}
              isFetchingNextPage={isFetchingNextPage}
              onFetchNextPage={fetchNextPage}
              getItemKey={(index) => get(fullEvents, [index, 'id'])}
              renderItem={(item) => (
                <FeedEventItem
                  className="animate-fade-in mb-2"
                  event={item}
                  actions={
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-6 w-6 overflow-hidden"
                      onClick={() => handleUnArchive(item)}
                    >
                      <LuArchiveRestore size={12} />
                    </Button>
                  }
                />
              )}
              renderEmpty={() => (
                <div className="w-full overflow-hidden p-4">
                  <div className="text-muted text-center">
                    {isInitialLoading
                      ? t('Loading...')
                      : t('No archived events')}
                  </div>
                </div>
              )}
            />
          </div>
        </PopoverContent>
      </Popover>
    );
  });
FeedArchivePageButton.displayName = 'FeedArchivePageButton';
