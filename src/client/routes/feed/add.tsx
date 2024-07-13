import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import {
  FeedChannelEditForm,
  FeedChannelEditFormValues,
} from '@/components/feed/FeedChannelEditForm';

export const Route = createFileRoute('/feed/add')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const createMutation = trpc.feed.createChannel.useMutation({
    onError: defaultErrorHandler,
  });
  const utils = trpc.useUtils();
  const navigate = useNavigate();

  const onSubmit = useEvent(async (values: FeedChannelEditFormValues) => {
    const res = await createMutation.mutateAsync({
      ...values,
      workspaceId,
    });

    utils.feed.channels.refetch();

    navigate({
      to: '/feed/$channelId',
      params: {
        channelId: res.id,
      },
    });
  });

  return (
    <CommonWrapper
      header={<h1 className="text-xl font-bold">{t('Add Channel')}</h1>}
    >
      <div className="p-4">
        <FeedChannelEditForm onSubmit={onSubmit} />
      </div>
    </CommonWrapper>
  );
}
