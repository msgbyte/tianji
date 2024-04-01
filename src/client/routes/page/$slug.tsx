import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { MonitorStatusPage } from '@/components/monitor/StatusPage';
import { Button } from '@/components/ui/button';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { Link, createFileRoute, useNavigate } from '@tanstack/react-router';
import { LuEye } from 'react-icons/lu';

export const Route = createFileRoute('/page/$slug')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { slug } = Route.useParams<{ slug: string }>();
  const { t } = useTranslation();
  const navigate = useNavigate();
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
    <CommonWrapper
      header={
        <CommonHeader
          title={pageInfo.title}
          actions={
            <Link to="/status/$slug" params={{ slug }} target="_blank">
              <Button variant="outline" Icon={LuEye}>
                {t('Preview')}
              </Button>
            </Link>
          }
        />
      }
    >
      <MonitorStatusPage slug={slug} showBackBtn={false} />
    </CommonWrapper>
  );
}
