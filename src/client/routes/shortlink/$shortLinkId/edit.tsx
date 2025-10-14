import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import {
  ShortLinkEditForm,
  ShortLinkEditFormValues,
} from '@/components/shortlink/ShortLinkEditForm';
import { toast } from 'sonner';

export const Route = createFileRoute('/shortlink/$shortLinkId/edit')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { shortLinkId } = Route.useParams<{ shortLinkId: string }>();
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const { data: shortLink } = trpc.shortlink.get.useQuery({
    workspaceId,
    id: shortLinkId,
  });
  const updateMutation = trpc.shortlink.update.useMutation({
    onError: defaultErrorHandler,
  });
  const utils = trpc.useUtils();
  const navigate = useNavigate();

  const onSubmit = useEvent(async (values: ShortLinkEditFormValues) => {
    await updateMutation.mutateAsync({
      ...values,
      workspaceId,
      id: shortLinkId,
    });

    utils.shortlink.all.refetch();
    utils.shortlink.get.refetch();
    toast.success(t('Short link updated successfully'));

    navigate({
      to: '/shortlink/$shortLinkId',
      params: {
        shortLinkId,
      },
    });
  });

  if (!shortLink) {
    return (
      <CommonWrapper
        header={<h1 className="text-xl font-bold">{t('Edit Short Link')}</h1>}
      >
        <div className="flex h-full items-center justify-center">
          <div className="text-muted-foreground">{t('Loading...')}</div>
        </div>
      </CommonWrapper>
    );
  }

  return (
    <CommonWrapper
      header={<h1 className="text-xl font-bold">{t('Edit Short Link')}</h1>}
    >
      <div className="p-4">
        <ShortLinkEditForm
          isEdit={true}
          defaultValues={{
            originalUrl: shortLink.originalUrl,
            code: shortLink.code,
            title: shortLink.title ?? '',
            description: shortLink.description ?? '',
            enabled: shortLink.enabled,
          }}
          onSubmit={onSubmit}
        />
      </div>
    </CommonWrapper>
  );
}
