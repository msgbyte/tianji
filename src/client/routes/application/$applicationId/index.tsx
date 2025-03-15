import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { LuPencil } from 'react-icons/lu';

export const Route = createFileRoute('/application/$applicationId/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { applicationId } = Route.useParams<{ applicationId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const { data: application, isLoading } = trpc.application.info.useQuery({
    workspaceId,
    applicationId,
  });
  const navigate = useNavigate();
  const hasAdminPermission = useHasAdminPermission();

  if (!applicationId) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!application) {
    return <NotFoundTip />;
  }

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={application.name}
          actions={
            <div className="space-x-2">
              {hasAdminPermission && (
                <Button
                  size="icon"
                  variant="outline"
                  Icon={LuPencil}
                  onClick={() =>
                    navigate({
                      to: '/application/$applicationId/edit',
                      params: {
                        applicationId,
                      },
                    })
                  }
                />
              )}
            </div>
          }
        />
      }
    >
      <ScrollArea className="h-full overflow-hidden">
        <ScrollBar orientation="horizontal" />

        {/* TODO */}
      </ScrollArea>
    </CommonWrapper>
  );
}
