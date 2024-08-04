import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useMemo } from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { CommonHeader } from '@/components/CommonHeader';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import dayjs from 'dayjs';
import { formatNumber } from '@/utils/common';

export const Route = createFileRoute('/settings/usage')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const [startDate, endDate] = useMemo(
    () => [dayjs().startOf('month'), dayjs().endOf('day')],
    []
  );

  const { data } = trpc.billing.usage.useQuery({
    workspaceId,
    startAt: startDate.valueOf(),
    endAt: endDate.valueOf(),
  });

  return (
    <CommonWrapper header={<CommonHeader title={t('Usage')} />}>
      <ScrollArea className="h-full overflow-hidden p-4">
        <Card>
          <CardHeader>
            <div className="mb-2 text-lg">
              {t('Statistic Date')}:
              <span className="ml-2 font-bold">
                {startDate.format('YYYY/MM/DD')} -{' '}
                {endDate.format('YYYY/MM/DD')}
              </span>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              <Card className="flex-1">
                <CardHeader className="text-muted-foreground">
                  {t('Website Accepted Count')}
                </CardHeader>
                <CardContent>
                  {formatNumber(data?.websiteAcceptedCount ?? 0)}
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardHeader className="text-muted-foreground">
                  {t('Website Event Count')}
                </CardHeader>
                <CardContent>
                  {formatNumber(data?.websiteEventCount ?? 0)}
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardHeader className="text-muted-foreground">
                  {t('Monitor Execution Count')}
                </CardHeader>
                <CardContent>
                  {formatNumber(data?.monitorExecutionCount ?? 0)}
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardHeader className="text-muted-foreground">
                  {t('Survey Count')}
                </CardHeader>
                <CardContent>
                  {formatNumber(data?.surveyCount ?? 0)}
                </CardContent>
              </Card>

              <Card className="flex-1">
                <CardHeader className="text-muted-foreground">
                  {t('Feed Event Count')}
                </CardHeader>
                <CardContent>
                  {formatNumber(data?.feedEventCount ?? 0)}
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>
      </ScrollArea>
    </CommonWrapper>
  );
}
