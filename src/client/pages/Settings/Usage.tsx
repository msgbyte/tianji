import { Card, Statistic } from 'antd';
import React, { useMemo } from 'react';
import { PageHeader } from '../../components/PageHeader';
import { useTranslation } from '@i18next-toolkit/react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import dayjs from 'dayjs';
import { formatNumber } from '../../utils/common';

export const Usage: React.FC = React.memo(() => {
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
    <div>
      <PageHeader title={t('Usage')} />

      <Card>
        <div className="text-lg mb-2">
          {t('Statistic Date')}:
          <span className="font-bold ml-2">
            {startDate.format('YYYY/MM/DD')} - {endDate.format('YYYY/MM/DD')}
          </span>
        </div>

        <div className="flex gap-2">
          <Card className="flex-1">
            <Statistic
              title={t('Website Accepted Count')}
              value={formatNumber(data?.websiteAcceptedCount ?? 0)}
            />
          </Card>

          <Card className="flex-1">
            <Statistic
              title={t('Website Event Count')}
              value={formatNumber(data?.websiteEventCount ?? 0)}
            />
          </Card>

          <Card className="flex-1">
            <Statistic
              title={t('Monitor Execution Count')}
              value={formatNumber(data?.monitorExecutionCount ?? 0)}
            />
          </Card>
        </div>
      </Card>
    </div>
  );
});
Usage.displayName = 'Usage';
