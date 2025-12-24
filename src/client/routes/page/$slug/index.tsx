import { trpc } from '@/api/trpc';
import { AlertConfirm } from '@/components/AlertConfirm';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { MonitorStatusPage } from '@/components/monitor/StatusPage';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useEvent } from '@/hooks/useEvent';
import { useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { LuEye, LuTrash } from 'react-icons/lu';

export const Route = createFileRoute('/page/$slug/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { slug } = Route.useParams<{ slug: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { data: pageInfo, isLoading } = trpc.page.getPageInfo.useQuery({
    slug,
  });
  const trpcUtils = trpc.useUtils();
  const hasAdminPermission = useHasAdminPermission();

  const deletePageMutation = trpc.page.deletePage.useMutation();

  const handleDelete = useEvent(async () => {
    if (!pageInfo) {
      return;
    }

    await deletePageMutation.mutateAsync({
      workspaceId: pageInfo.workspaceId,
      id: pageInfo.id,
    });

    trpcUtils.page.getAllPages.refetch({
      workspaceId: pageInfo.workspaceId,
      type: 'status',
    });

    navigate({
      to: '/page',
      replace: true,
    });
  });

  if (!slug) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!pageInfo) {
    return <NotFoundTip />;
  }

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={pageInfo.title}
          actions={
            <div className="space-x-2">
              {hasAdminPermission && (
                <AlertConfirm
                  title={t('Confirm to delete this page?')}
                  content={t('It will permanently delete the relevant data')}
                  onConfirm={handleDelete}
                >
                  <Button variant="outline" size="icon" Icon={LuTrash} />
                </AlertConfirm>
              )}

              <Link to="/status/$slug" params={{ slug }} target="_blank">
                <Button variant="outline" Icon={LuEye}>
                  {t('Preview')}
                </Button>
              </Link>
            </div>
          }
        />
      }
    >
      <ScrollArea className="h-full overflow-hidden">
        <MonitorStatusPage slug={slug} showBackBtn={false} fullWidth={true} />
      </ScrollArea>
    </CommonWrapper>
  );
}
