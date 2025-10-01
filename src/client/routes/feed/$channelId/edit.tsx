import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { Card, CardContent } from '@/components/ui/card';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import { Loading } from '@/components/Loading';
import { ErrorTip } from '@/components/ErrorTip';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  FeedChannelEditForm,
  FeedChannelEditFormValues,
} from '@/components/feed/FeedChannelEditForm';

export const Route = createFileRoute('/feed/$channelId/edit')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const { channelId } = Route.useParams<{ channelId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const mutation = trpc.feed.updateChannelInfo.useMutation({
    onError: defaultErrorHandler,
  });
  const refreshPublicShareMutation = trpc.feed.refreshPublicShareId.useMutation(
    {
      onError: defaultErrorHandler,
    }
  );
  const disablePublicShareMutation = trpc.feed.disablePublicShareId.useMutation(
    {
      onError: defaultErrorHandler,
    }
  );
  const { data: channel, isLoading } = trpc.feed.channelInfo.useQuery({
    workspaceId,
    channelId,
  });
  const trpcUtils = trpc.useUtils();

  const handleSubmit = useEvent(async (values: FeedChannelEditFormValues) => {
    const res = await mutation.mutateAsync({
      ...values,
      channelId,
      workspaceId,
    });

    trpcUtils.feed.channelInfo.setData(
      {
        channelId,
        workspaceId,
      },
      res
    );
    trpcUtils.feed.channels.setData(
      {
        workspaceId,
      },
      (prev) => {
        if (prev) {
          const index = prev.findIndex((item) => item.id === channelId);
          if (index >= 0) {
            prev[index] = {
              ...prev[index],
              ...res,
            };
          }
        }

        return prev;
      }
    );

    if (res) {
      navigate({
        to: '/feed/$channelId',
        params: {
          channelId: res.id,
        },
        replace: true,
      });
    } else {
      navigate({
        to: '/feed',
        replace: true,
      });
    }
  });

  const handleRefreshPublicShare = useEvent(async () => {
    const res = await refreshPublicShareMutation.mutateAsync({
      workspaceId,
      channelId,
    });
    await trpcUtils.feed.channelInfo.invalidate({
      workspaceId,
      channelId,
    });
    return res.publicShareId;
  });

  const handleDisablePublicShare = useEvent(async () => {
    const res = await disablePublicShareMutation.mutateAsync({
      workspaceId,
      channelId,
    });
    await trpcUtils.feed.channelInfo.invalidate({
      workspaceId,
      channelId,
    });
    return res.publicShareId;
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!channel) {
    return <ErrorTip />;
  }

  return (
    <CommonWrapper
      header={<CommonHeader title={channel.name} desc={t('Edit')} />}
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <Card>
          <CardContent className="pt-4">
            <FeedChannelEditForm
              defaultValues={channel}
              onSubmit={handleSubmit}
              onRefreshPublicShare={handleRefreshPublicShare}
              onDisablePublicShare={handleDisablePublicShare}
            />
          </CardContent>
        </Card>
      </ScrollArea>
    </CommonWrapper>
  );
}
