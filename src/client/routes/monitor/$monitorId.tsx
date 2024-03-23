import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { MonitorInfo } from '@/components/monitor/MonitorInfo';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrentWorkspaceId } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/monitor/$monitorId')({
  beforeLoad: routeAuthBeforeLoad,
  component: MonitorDetailComponent,
});

function MonitorDetailComponent() {
  const { monitorId } = Route.useParams<{ monitorId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const { data: monitor, isLoading } = trpc.monitor.get.useQuery({
    workspaceId,
    monitorId,
  });

  if (!monitorId) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!monitor) {
    return <NotFoundTip />;
  }

  return (
    <CommonWrapper header={<CommonHeader title={monitor.name} />}>
      <ScrollArea className="h-full overflow-hidden p-4">
        <MonitorInfo monitorId={monitor.id} />
      </ScrollArea>
    </CommonWrapper>
  );
}
