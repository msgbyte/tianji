import { trpc } from '@/api/trpc';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { MonitorStatusPage } from '@/components/monitor/StatusPage';
import { Button } from '@/components/ui/button';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/status/$slug')({
  component: PageComponent,
});

function PageComponent() {
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

  return <MonitorStatusPage slug={slug} />;
}
