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

export const Route = createFileRoute('/shortlink/add')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const createMutation = trpc.shortlink.create.useMutation({
    onError: defaultErrorHandler,
  });
  const utils = trpc.useUtils();
  const navigate = useNavigate();

  const onSubmit = useEvent(async (values: ShortLinkEditFormValues) => {
    const res = await createMutation.mutateAsync({
      ...values,
      workspaceId,
    });

    utils.shortlink.all.refetch();
    toast.success(t('Short link created successfully'));

    navigate({
      to: '/shortlink/$shortLinkId',
      params: {
        shortLinkId: res.id,
      },
    });
  });

  return (
    <CommonWrapper
      header={<h1 className="text-xl font-bold">{t('Create Short Link')}</h1>}
    >
      <div className="p-4">
        <ShortLinkEditForm onSubmit={onSubmit} />
      </div>
    </CommonWrapper>
  );
}
