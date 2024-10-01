import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { WebsiteCodeBtn } from '@/components/website/WebsiteCodeBtn';
import { WebsiteLighthouseBtn } from '@/components/website/WebsiteLighthouseBtn';
import { WebsiteMetricsTable } from '@/components/website/WebsiteMetricsTable';
import { WebsiteOverview } from '@/components/website/WebsiteOverview';
import { WebsiteVisitorMapBtn } from '@/components/website/WebsiteVisitorMapBtn';
import { useGlobalRangeDate } from '@/hooks/useGlobalRangeDate';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Card } from 'antd';
import { LuSettings } from 'react-icons/lu';

export const Route = createFileRoute('/website/$websiteId/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { websiteId } = Route.useParams<{ websiteId: string }>();
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const { data: website, isLoading } = trpc.website.info.useQuery({
    workspaceId,
    websiteId,
  });
  const { startDate, endDate } = useGlobalRangeDate();
  const navigate = useNavigate();
  const hasAdminPermission = useHasAdminPermission();

  if (!websiteId) {
    return <ErrorTip />;
  }

  if (isLoading) {
    return <Loading />;
  }

  if (!website) {
    return <NotFoundTip />;
  }

  const startAt = startDate.unix() * 1000;
  const endAt = endDate.unix() * 1000;

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={website.name}
          actions={
            <div className="space-x-2">
              {hasAdminPermission && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={() =>
                    navigate({
                      to: '/website/$websiteId/config',
                      params: {
                        websiteId,
                      },
                    })
                  }
                >
                  <LuSettings />
                </Button>
              )}

              <WebsiteLighthouseBtn websiteId={website.id} />

              <WebsiteCodeBtn websiteId={website.id} />
            </div>
          }
        />
      }
    >
      <ScrollArea className="h-full overflow-hidden">
        <ScrollBar orientation="horizontal" />

        <Card bordered={false} className="bg-transparent">
          <Card.Grid hoverable={false} className="!w-full">
            <WebsiteOverview website={website} showDateFilter={true} />
          </Card.Grid>
          <Card.Grid
            hoverable={false}
            className="!w-full sm:min-h-[470px] sm:!w-1/2"
          >
            <WebsiteMetricsTable
              websiteId={websiteId}
              type="url"
              title={[t('Pages'), t('Views')]}
              startAt={startAt}
              endAt={endAt}
            />
          </Card.Grid>
          <Card.Grid
            hoverable={false}
            className="!w-full sm:min-h-[470px] sm:!w-1/2"
          >
            <WebsiteMetricsTable
              websiteId={websiteId}
              type="referrer"
              title={[t('Referrers'), t('Views')]}
              startAt={startAt}
              endAt={endAt}
            />
          </Card.Grid>
          <Card.Grid
            hoverable={false}
            className="!w-full sm:min-h-[470px] sm:!w-1/2 md:!w-1/3"
          >
            <WebsiteMetricsTable
              websiteId={websiteId}
              type="browser"
              title={[t('Browser'), t('Visitors')]}
              startAt={startAt}
              endAt={endAt}
            />
          </Card.Grid>
          <Card.Grid
            hoverable={false}
            className="!w-full sm:min-h-[470px] sm:!w-1/2 md:!w-1/3"
          >
            <WebsiteMetricsTable
              websiteId={websiteId}
              type="os"
              title={[t('OS'), t('Visitors')]}
              startAt={startAt}
              endAt={endAt}
            />
          </Card.Grid>
          <Card.Grid
            hoverable={false}
            className="!w-full sm:min-h-[470px] sm:!w-1/2 md:!w-1/3"
          >
            <WebsiteMetricsTable
              websiteId={websiteId}
              type="device"
              title={[t('Devices'), t('Visitors')]}
              startAt={startAt}
              endAt={endAt}
            />
          </Card.Grid>
          <Card.Grid
            hoverable={false}
            className="!w-full sm:min-h-[470px] sm:!w-1/2 md:!w-1/3"
          >
            <WebsiteMetricsTable
              websiteId={websiteId}
              type="title"
              title={[t('Title'), t('Views')]}
              startAt={startAt}
              endAt={endAt}
            />
          </Card.Grid>
          <Card.Grid
            hoverable={false}
            className="!w-full sm:min-h-[470px] sm:!w-1/2 md:!w-1/3"
          >
            <WebsiteMetricsTable
              websiteId={websiteId}
              type="country"
              title={[t('Country or Region'), t('Visitors')]}
              startAt={startAt}
              endAt={endAt}
            />

            <div className="mt-2 text-center">
              <WebsiteVisitorMapBtn websiteId={websiteId} />
            </div>
          </Card.Grid>
          <Card.Grid
            hoverable={false}
            className="!w-full sm:min-h-[470px] sm:!w-1/2 md:!w-1/3"
          >
            <WebsiteMetricsTable
              websiteId={websiteId}
              type="event"
              title={[t('Events'), t('Actions')]}
              startAt={startAt}
              endAt={endAt}
            />
          </Card.Grid>
        </Card>
      </ScrollArea>
    </CommonWrapper>
  );
}
