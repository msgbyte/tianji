import {
  AppRouterOutput,
  defaultErrorHandler,
  defaultSuccessHandler,
  trpc,
} from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrentWorkspaceId } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useEvent } from '@/hooks/useEvent';
import { AlertConfirm } from '@/components/AlertConfirm';
import { LuPencil, LuTrash } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import { Scrollbar } from '@radix-ui/react-scroll-area';
import { Empty } from 'antd';
import { FeedApiGuide } from '@/components/feed/FeedApiGuide';
import { FeedEventItem } from '@/components/feed/FeedEventItem';

export const Route = createFileRoute('/feed/$channelId/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { channelId } = Route.useParams<{ channelId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { data: info } = trpc.feed.channelInfo.useQuery({
    workspaceId,
    channelId,
  });
  const { data: events } = trpc.feed.events.useQuery({
    workspaceId,
    channelId,
  });
  const deleteMutation = trpc.feed.deleteChannel.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const trpcUtils = trpc.useUtils();
  const navigate = useNavigate();

  const handleDelete = useEvent(async () => {
    await deleteMutation.mutateAsync({ workspaceId, channelId });
    trpcUtils.feed.channels.refetch();
    navigate({
      to: '/feed',
      replace: true,
    });
  });

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={info?.name ?? ''}
          actions={
            <div className="space-x-2">
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

              <AlertConfirm
                title={t('Confirm to delete this channel?')}
                description={t('All feed will be remove')}
                content={t('It will permanently delete the relevant data')}
                onConfirm={handleDelete}
              >
                <Button variant="outline" size="icon" Icon={LuTrash} />
              </AlertConfirm>
            </div>
          }
        />
      }
    >
      {events && events.length === 0 ? (
        <div className="w-full overflow-hidden p-4">
          <FeedApiGuide channelId={channelId} />
        </div>
      ) : (
        <ScrollArea className="h-full overflow-hidden p-4">
          {(events ?? []).map((event) => (
            <FeedEventItem key={event.id} event={event} />
          ))}
        </ScrollArea>
      )}
    </CommonWrapper>
  );
}
