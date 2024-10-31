import {
  AppRouterOutput,
  defaultErrorHandler,
  defaultSuccessHandler,
  trpc,
} from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEvent } from '@/hooks/useEvent';
import { AlertConfirm } from '@/components/AlertConfirm';
import {
  LuArchive,
  LuLink,
  LuPencil,
  LuTrash,
  LuWebhook,
} from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { FeedApiGuide } from '@/components/feed/FeedApiGuide';
import { FeedEventItem } from '@/components/feed/FeedEventItem';
import { FeedIntegration } from '@/components/feed/FeedIntegration';
import { DialogWrapper } from '@/components/DialogWrapper';
import { useSocketSubscribeList } from '@/api/socketio';
import { useMemo } from 'react';
import { DynamicVirtualList } from '@/components/DynamicVirtualList';
import { get, reverse } from 'lodash-es';
import { FeedArchivePageButton } from '@/components/feed/FeedArchivePageButton';
import { toast } from 'sonner';

export const Route = createFileRoute('/feed/$channelId/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

type FeedItem = AppRouterOutput['feed']['fetchEventsByCursor']['items'][number];

function PageComponent() {
  const { channelId } = Route.useParams<{ channelId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { data: info } = trpc.feed.channelInfo.useQuery({
    workspaceId,
    channelId,
  });
  const hasAdminPermission = useHasAdminPermission();

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
    },
    {
      refetchOnWindowFocus: false,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
    }
  );

  const deleteMutation = trpc.feed.deleteChannel.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const trpcUtils = trpc.useUtils();
  const navigate = useNavigate();

  const archiveEventMutation = trpc.feed.archiveEvent.useMutation();
  const handleDelete = useEvent(async () => {
    await deleteMutation.mutateAsync({ workspaceId, channelId });
    trpcUtils.feed.channels.refetch();
    navigate({
      to: '/feed',
      replace: true,
    });
  });

  const realtimeEvents = useSocketSubscribeList('onReceiveFeedEvent', {
    filter: (event) => event.channelId === channelId,
  });

  const fullEvents = useMemo(
    () => [
      ...reverse(realtimeEvents),
      ...(data?.pages.flatMap((p) => p.items) ?? []),
    ],
    [realtimeEvents, data]
  );

  const handleArchive = useEvent(async (event: FeedItem) => {
    await archiveEventMutation.mutateAsync({
      workspaceId,
      channelId: event.channelId,
      eventId: event.id,
    });
    trpcUtils.feed.fetchEventsByCursor.refetch();
    toast.success(t('Event archived'));
  });

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={info?.name ?? ''}
          actions={
            <div className="space-x-2">
              {info?.id && (
                <DialogWrapper
                  title={t('Integration')}
                  content={
                    <FeedIntegration
                      feedId={info.id}
                      webhookSignature={info.webhookSignature}
                    />
                  }
                >
                  <Button variant="default" size="icon" Icon={LuWebhook} />
                </DialogWrapper>
              )}

              <FeedArchivePageButton channelId={channelId} />

              {hasAdminPermission && (
                <Button
                  variant="outline"
                  size="icon"
                  Icon={LuPencil}
                  onClick={() =>
                    navigate({
                      to: '/feed/$channelId/edit',
                      params: {
                        channelId,
                      },
                    })
                  }
                />
              )}

              {hasAdminPermission && (
                <AlertConfirm
                  title={t('Confirm to delete this channel?')}
                  description={t('All feed will be remove')}
                  content={t('It will permanently delete the relevant data')}
                  onConfirm={handleDelete}
                >
                  <Button variant="outline" size="icon" Icon={LuTrash} />
                </AlertConfirm>
              )}
            </div>
          }
        />
      }
    >
      <div className="h-full w-full overflow-hidden p-4">
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
                <>
                  {item.url && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-6 w-6 overflow-hidden"
                      onClick={() => window.open(item.url)}
                    >
                      <LuLink size={12} />
                    </Button>
                  )}

                  {hasAdminPermission && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-6 w-6 overflow-hidden"
                      onClick={() => handleArchive(item)}
                    >
                      <LuArchive size={12} />
                    </Button>
                  )}
                </>
              }
            />
          )}
          renderEmpty={() => (
            <div className="w-full overflow-hidden p-4">
              {!isInitialLoading && (
                <FeedApiGuide
                  channelId={channelId}
                  webhookSignature={info?.webhookSignature}
                />
              )}
            </div>
          )}
        />
      </div>
    </CommonWrapper>
  );
}
