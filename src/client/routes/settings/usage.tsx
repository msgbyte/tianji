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
import { UsageCard } from '@/components/UsageCard';

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

  const { data: serviceCountData } = trpc.workspace.getServiceCount.useQuery({
    workspaceId,
  });

  const { data: billingUsageData } = trpc.billing.usage.useQuery({
    workspaceId,
    startAt: startDate.valueOf(),
    endAt: endDate.valueOf(),
  });

  const { data: limit } = trpc.billing.limit.useQuery({
    workspaceId,
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
              <UsageCard
                title={t('Website Count')}
                current={serviceCountData?.website ?? 0}
                limit={limit?.maxWebsiteCount}
              />

              <UsageCard
                title={t('Monitor Count')}
                current={serviceCountData?.monitor ?? 0}
              />

              <UsageCard
                title={t('Survey Count')}
                current={serviceCountData?.survey ?? 0}
              />

              <UsageCard
                title={t('Page Count')}
                current={serviceCountData?.page ?? 0}
              />

              <UsageCard
                title={t('Feed Channel Count')}
                current={serviceCountData?.feed ?? 0}
                limit={limit?.maxFeedChannelCount}
              />

              <UsageCard
                title={t('Website Accepted Count')}
                current={billingUsageData?.websiteAcceptedCount ?? 0}
              />

              <UsageCard
                title={t('Website Event Count')}
                current={billingUsageData?.websiteEventCount ?? 0}
                limit={limit?.maxWebsiteEventCount}
              />

              <UsageCard
                title={t('Monitor Execution Count')}
                current={billingUsageData?.monitorExecutionCount ?? 0}
                limit={limit?.maxMonitorExecutionCount}
              />

              <UsageCard
                title={t('Survey Count')}
                current={billingUsageData?.surveyCount ?? 0}
                limit={limit?.maxSurveyCount}
              />

              <UsageCard
                title={t('Feed Event Count')}
                current={billingUsageData?.feedEventCount ?? 0}
                limit={limit?.maxFeedEventCount}
              />
            </div>
          </CardContent>
        </Card>
      </ScrollArea>
    </CommonWrapper>
  );
}
