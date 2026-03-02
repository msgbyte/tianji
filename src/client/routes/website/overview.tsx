import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { Button } from '@/components/ui/button';
import { useCurrentWorkspaceId } from '@/store/user';
import { trpc } from '@/api/trpc';
import { CommonWrapper } from '@/components/CommonWrapper';
import { Empty } from 'antd';
import { LuActivity, LuGlobe, LuPlus } from 'react-icons/lu';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CommonHeader } from '@/components/CommonHeader';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { WebsiteOnlineCount } from '@/components/website/WebsiteOnlineCount';
import { MonitorHealthBar } from '@/components/monitor/MonitorHealthBar';
import { formatNumber } from '@/utils/common';
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/website/overview')({
  beforeLoad: routeAuthBeforeLoad,
  component: WebsiteOverviewComponent,
});

function WebsiteOverviewComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const { data: websites = [], isLoading } = trpc.website.all.useQuery({
    workspaceId,
  });
  const { data: overviewData = {} } = trpc.website.allOverview.useQuery({
    workspaceId,
  });
  const navigate = useNavigate();

  return (
    <CommonWrapper header={<CommonHeader title={t('Website Overview')} />}>
      <ScrollArea className="h-full overflow-hidden p-4">
        {websites.length === 0 && isLoading === false && (
          <Empty
            className="pt-8"
            description={
              <div className="py-2">
                <div className="mb-1">
                  {t('Not any website has been exist')}
                </div>
                <Button
                  Icon={LuPlus}
                  onClick={() =>
                    navigate({
                      to: '/website/add',
                    })
                  }
                >
                  {t('Add Website Now')}
                </Button>
              </div>
            }
          />
        )}

        <div className="grid grid-cols-1 gap-4 p-4 sm:grid-cols-2 lg:grid-cols-3">
          {websites.map((website) => {
            const eventCount = overviewData[website.id] ?? 0;

            return (
              <Card
                key={website.id}
                className="cursor-pointer transition-shadow hover:shadow-md"
                onClick={() =>
                  navigate({
                    to: '/website/$websiteId',
                    params: { websiteId: website.id },
                  })
                }
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="truncate text-lg">
                      {website.name}
                    </CardTitle>
                    <WebsiteOnlineCount
                      workspaceId={website.workspaceId}
                      websiteId={website.id}
                    />
                  </div>
                  {website.domain && (
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <LuGlobe className="h-3.5 w-3.5 flex-shrink-0" />
                      <span className="truncate">{website.domain}</span>
                    </div>
                  )}
                </CardHeader>

                <CardContent className="pb-3">
                  <div className="flex items-center gap-2 text-sm">
                    <LuActivity className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">
                      {formatNumber(eventCount)}
                    </span>
                    <span className="text-muted-foreground">
                      {t('events in 24h')}
                    </span>
                  </div>
                </CardContent>

                {website.monitorId && (
                  <>
                    <Separator />
                    <CardFooter className="pt-3">
                      <MonitorHealthBar
                        workspaceId={website.workspaceId}
                        monitorId={website.monitorId}
                        size="small"
                      />
                    </CardFooter>
                  </>
                )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>
    </CommonWrapper>
  );
}
