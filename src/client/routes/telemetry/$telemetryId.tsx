import { trpc } from '@/api/trpc';
import { CommonHeader } from '@/components/CommonHeader';
import { CommonWrapper } from '@/components/CommonWrapper';
import { TelemetryMetricsTable } from '@/components/telemetry/TelemetryMetricsTable';
import { TelemetryOverview } from '@/components/telemetry/TelemetryOverview';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { useGlobalRangeDate } from '@/hooks/useGlobalRangeDate';
import { useCurrentWorkspaceId } from '@/store/user';
import { routeAuthBeforeLoad } from '@/utils/route';
import { Trans, useTranslation } from '@i18next-toolkit/react';
import { createFileRoute } from '@tanstack/react-router';
import { Card, Typography } from 'antd';
import { LuChevronRight, LuCode2 } from 'react-icons/lu';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

export const Route = createFileRoute('/telemetry/$telemetryId')({
  beforeLoad: routeAuthBeforeLoad,
  component: TelemetryDetailComponent,
});

function TelemetryDetailComponent() {
  const { telemetryId } = Route.useParams<{ telemetryId: string }>();
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { startDate, endDate } = useGlobalRangeDate();
  const { data: info } = trpc.telemetry.info.useQuery({
    workspaceId,
    telemetryId,
  });

  const startAt = startDate.valueOf();
  const endAt = endDate.valueOf();

  const blankGif = `${window.location.origin}/telemetry/${workspaceId}/${telemetryId}.gif`;
  const countBadgeUrl = `${window.location.origin}/telemetry/${workspaceId}/${telemetryId}/badge.svg`;

  return (
    <CommonWrapper
      header={
        <CommonHeader
          title={info?.name ?? ''}
          actions={
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="outline" Icon={LuCode2}>
                  {t('Usage')}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Usage</AlertDialogTitle>
                </AlertDialogHeader>

                <div className="space-y-2">
                  <p>Here is some way to use telemetry:</p>
                  <Typography.Title level={3}>
                    Insert to article:
                  </Typography.Title>
                  <p>
                    if your article support raw html, you can direct insert it{' '}
                    <Typography.Text code={true} copyable={{ text: blankGif }}>
                      {blankGif}
                    </Typography.Text>
                  </p>

                  <Collapsible>
                    <CollapsibleTrigger>Advanced</CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="pl-5">
                        <p>
                          Some website will not allow send `referer` field. so
                          its maybe can not track source. so you can mark it by
                          yourself. for example:
                        </p>
                        <p>
                          <Typography.Text code={true}>
                            {blankGif}?url=https://xxxxxxxx
                          </Typography.Text>
                        </p>
                      </div>
                    </CollapsibleContent>
                  </Collapsible>

                  <Typography.Title level={3}>
                    Count your website visitor:
                  </Typography.Title>
                  <p>
                    if your article support raw html, you can direct insert it{' '}
                    <Typography.Text
                      code={true}
                      copyable={{ text: countBadgeUrl }}
                    >
                      {countBadgeUrl}
                    </Typography.Text>
                  </p>
                  <p>
                    Like this: <img src={countBadgeUrl} />
                  </p>
                </div>

                <AlertDialogFooter>
                  <AlertDialogAction>{t('Get!')}</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          }
        />
      }
    >
      <ScrollArea className="h-full overflow-hidden p-4">
        <ScrollBar orientation="horizontal" />

        <Card>
          <Card.Grid hoverable={false} className="!w-full">
            <TelemetryOverview
              telemetryId={telemetryId}
              showDateFilter={true}
              workspaceId={workspaceId}
            />
          </Card.Grid>

          <Card.Grid hoverable={false} className="min-h-[470px] !w-1/3">
            <TelemetryMetricsTable
              telemetryId={telemetryId}
              type="source"
              title={[t('Source'), t('Views')]}
              startAt={startAt}
              endAt={endAt}
            />
          </Card.Grid>

          <Card.Grid hoverable={false} className="min-h-[470px] !w-1/3">
            <TelemetryMetricsTable
              telemetryId={telemetryId}
              type="event"
              title={[t('Events'), t('Views')]}
              startAt={startAt}
              endAt={endAt}
            />
          </Card.Grid>

          <Card.Grid hoverable={false} className="min-h-[470px] !w-1/3">
            <TelemetryMetricsTable
              telemetryId={telemetryId}
              type="country"
              title={[t('Countries'), t('Visitors')]}
              startAt={startAt}
              endAt={endAt}
            />
          </Card.Grid>
        </Card>
      </ScrollArea>
    </CommonWrapper>
  );
}
