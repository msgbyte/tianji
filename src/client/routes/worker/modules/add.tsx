import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { toast } from 'sonner';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  SharedModuleEditForm,
  type SharedModuleEditFormValues,
} from '@/components/worker/SharedModuleEditForm';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId, useUserInfo } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';

export const Route = createFileRoute('/worker/modules/add')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const userId = useUserInfo()?.id;
  const navigate = useNavigate();
  const utils = trpc.useUtils();
  const publishMutation = trpc.sharedModule.publish.useMutation({
    onError: defaultErrorHandler,
  });

  const publish = useEvent(async (values: SharedModuleEditFormValues) => {
    const { module, revision } = await publishMutation.mutateAsync({
      workspaceId,
      ...values,
    });
    await Promise.all([
      utils.sharedModule.all.invalidate({ workspaceId }),
      utils.sharedModule.bindingOptions.invalidate({ workspaceId }),
    ]);
    toast.success(
      t('Published revision #{{revision}}', { revision: revision.revision })
    );
    navigate({
      to: '/worker/modules/$moduleId',
      params: { moduleId: module.id },
    });
  });

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={t('Create Shared Module')}
          desc={t('Create a reusable workspace TypeScript module')}
        />
      }
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <SharedModuleEditForm
          defaultValues={{ ownerId: userId }}
          onPublish={publish}
          publishing={publishMutation.isPending}
        />
      </ScrollArea>
    </CommonWrapper>
  );
}
