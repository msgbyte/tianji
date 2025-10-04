import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { DevContainer } from '@/components/DevContainer';
import { ErrorTip } from '@/components/ErrorTip';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { WebsiteCodeBtn } from '@/components/website/WebsiteCodeBtn';
import { WebsiteLighthouseBtn } from '@/components/website/WebsiteLighthouseBtn';
import { WebsiteMetricsTable } from '@/components/website/WebsiteMetricsTable';
import { WebsiteOverview } from '@/components/website/WebsiteOverview';
import { WebsiteEventAnalysis } from '@/components/website/WebsiteEventAnalysis';
import { WebsiteSimpleMap } from '@/components/website/WebsiteSimpleMap';
import { WebsiteVisitorMapBtn } from '@/components/website/WebsiteVisitorMapBtn';
import { useGlobalRangeDate } from '@/hooks/useGlobalRangeDate';
import { useInsightsStore } from '@/store/insights';
import { useCurrentWorkspaceId, useHasAdminPermission } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { Card } from 'antd';
import { LuCompass, LuSettings, LuShare2 } from 'react-icons/lu';
import copy from 'copy-to-clipboard';
import { toast } from 'sonner';
import { useMemo } from 'react';
import { SimpleTooltip } from '@/components/ui/tooltip';

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

  const shareLink = useMemo(() => {
    if (!website?.shareId) {
      return '';
    }

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    if (origin) {
      return `${origin}/website/public/${website.shareId}`;
    }

    return `/website/public/${website.shareId}`;
  }, [website?.shareId]);

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

              {website.shareId && (
                <Button
                  size="icon"
                  variant="outline"
                  Icon={LuShare2}
                  onClick={() => {
                    copy(shareLink);
                    toast.success(t('Public share link copied to clipboard'));
                  }}
                  aria-label={t('Public share link copied to clipboard')}
                />
              )}

              {website.shareId ? (
                <Button
                  size="icon"
                  variant="outline"
                  Icon={LuShare2}
                  onClick={() => {
                    copy(shareLink);
                    toast.success(t('Public share link copied to clipboard'));
                  }}
                  aria-label={t('Public share link copied to clipboard')}
                />
              ) : (
                <SimpleTooltip
                  content={t('Public share is disabled for this website')}
                  tooltipProps={{ delayDuration: 0 }}
                >
                  <Button
                    variant="outline"
                    size="icon"
                    Icon={LuShare2}
                    disabled
                  />
                </SimpleTooltip>
              )}

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
            className="!w-full sm:min-h-[470px] sm:!w-full md:!w-2/3"
          >
            <WebsiteSimpleMap
              websiteId={websiteId}
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

            <DevContainer>
              <div className="mt-2 text-center">
                <Button
                  variant="outline"
                  Icon={LuCompass}
                  onClick={() => {
                    useInsightsStore.getState().reset();
                    useInsightsStore.setState({
                      insightId: websiteId,
                    });
                    navigate({
                      to: '/insights',
                    });
                  }}
                >
                  {t('Insights')}
                </Button>
              </div>
            </DevContainer>
          </Card.Grid>
          <Card.Grid
            hoverable={false}
            className="!w-full sm:min-h-[470px] sm:!w-1/2 md:!w-2/3"
          >
            <WebsiteEventAnalysis websiteId={websiteId} />
          </Card.Grid>
        </Card>
      </ScrollArea>
    </CommonWrapper>
  );
}
