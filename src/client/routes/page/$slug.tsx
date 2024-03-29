import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { MonitorStatusPage } from '@/components/monitor/StatusPage';
import { ScrollArea } from '@/components/ui/scroll-area';
import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/page/$slug')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageDetailComponent,
});

function PageDetailComponent() {
  const { slug } = Route.useParams<{ slug: string }>();
  const { data: pageInfo, isLoading } = trpc.monitor.getPageInfo.useQuery({
    slug,
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
    <CommonWrapper header={<CommonHeader title={pageInfo.title} />}>
      {/* <ScrollArea className="h-full overflow-hidden"> */}
      <MonitorStatusPage slug={slug} />
      {/* </ScrollArea> */}
    </CommonWrapper>
  );
}
