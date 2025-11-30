import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@i18next-toolkit/react';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { LoadingView } from '@/components/LoadingView';
import { DollarSign, AlertTriangle, CheckCircle, Settings } from 'lucide-react';
import dayjs from 'dayjs';
import { cn } from '@/utils/style';
import { getUserTimezone } from '@/api/model/user';

interface AIGatewayQuotaStatusProps {
  gatewayId: string;
  onOpenQuotaSettings: () => void;
}

export const AIGatewayQuotaStatus: React.FC<AIGatewayQuotaStatusProps> = ({
  gatewayId,
  onOpenQuotaSettings,
}) => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();

  // Get today's cost
  const { data: todayCost = 0, isLoading: isLoadingCost } =
    trpc.insights.query.useQuery(
      {
        workspaceId,
        insightId: gatewayId,
        insightType: 'aigateway',
        metrics: [{ name: 'price', math: 'events' }],
        filters: [],
        groups: [],
        time: {
          startAt: dayjs().startOf('day').valueOf(),
          endAt: dayjs().endOf('day').valueOf(),
          unit: 'day',
          timezone: getUserTimezone(),
        },
      },
      {
        select(data) {
          if (!data || data.length === 0) {
            return 0;
          }
          const counts = data[0]?.data || [];
          return counts.reduce((sum, item) => sum + item.value, 0);
        },
      }
    );

  // Get quota alert settings
  const { data: quotaAlert, isLoading: isLoadingQuota } =
    trpc.aiGateway.quotaAlert.get.useQuery({
      workspaceId,
      gatewayId,
    });

  const isLoading = isLoadingCost || isLoadingQuota;

  if (isLoading) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4" />
            {t('Daily Quota Status')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <LoadingView isLoading={true}>
            <div className="h-16" />
          </LoadingView>
        </CardContent>
      </Card>
    );
  }

  const hasQuotaAlert =
    quotaAlert && quotaAlert.enabled && quotaAlert.dailyQuota > 0;
  const quotaPercentage = hasQuotaAlert
    ? (todayCost / quotaAlert.dailyQuota) * 100
    : 0;

  // Determine current alert level
  const getCurrentAlertLevel = () => {
    if (!hasQuotaAlert) return null;
    if (quotaPercentage >= 150) return '150';
    if (quotaPercentage >= 100) return '100';
    if (quotaPercentage >= 80) return '80';
    return null;
  };

  const currentAlertLevel = getCurrentAlertLevel();

  const getStatusColor = () => {
    if (!hasQuotaAlert) return 'bg-gray-100 text-gray-600';
    if (currentAlertLevel === '150') return 'bg-red-100 text-red-600';
    if (currentAlertLevel === '100') return 'bg-orange-100 text-orange-600';
    if (currentAlertLevel === '80') return 'bg-yellow-100 text-yellow-600';
    return 'bg-green-100 text-green-600';
  };

  const getStatusIcon = () => {
    if (!hasQuotaAlert) return <Settings className="h-4 w-4" />;
    if (currentAlertLevel === '150')
      return <AlertTriangle className="h-4 w-4" />;
    if (currentAlertLevel === '100')
      return <AlertTriangle className="h-4 w-4" />;
    if (currentAlertLevel === '80')
      return <AlertTriangle className="h-4 w-4" />;
    return <CheckCircle className="h-4 w-4" />;
  };

  const getStatusText = () => {
    if (!hasQuotaAlert) return t('No quota set');
    if (currentAlertLevel === '150') return t('Critical: 150%+ quota');
    if (currentAlertLevel === '100') return t('Warning: 100%+ quota');
    if (currentAlertLevel === '80') return t('Notice: 80%+ quota');
    return t('Within quota');
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-sm">
            <DollarSign className="h-4 w-4" />
            {t('Daily Quota Status')}
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={onOpenQuotaSettings}
            className="h-6 px-2 text-xs"
          >
            <Settings className="mr-1 h-3 w-3" />
            {t('Settings')}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground text-sm">
            {t("Today's Cost")}
          </span>
          <span className="font-mono text-sm">${todayCost.toFixed(4)}</span>
        </div>

        {hasQuotaAlert && (
          <>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground text-sm">
                {t('Daily Quota')}
              </span>
              <span className="font-mono text-sm">
                ${quotaAlert.dailyQuota.toFixed(4)}
              </span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span>{t('Usage')}</span>
                <span>{quotaPercentage.toFixed(1)}%</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-200">
                <div
                  className={`h-2 rounded-full transition-all ${
                    currentAlertLevel === '150'
                      ? 'bg-red-500'
                      : currentAlertLevel === '100'
                        ? 'bg-orange-500'
                        : currentAlertLevel === '80'
                          ? 'bg-yellow-500'
                          : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(quotaPercentage, 100)}%` }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Badge className={`${getStatusColor()} border-0`}>
                <div className="flex items-center gap-1">
                  {getStatusIcon()}
                  {getStatusText()}
                </div>
              </Badge>
            </div>

            {/* Alert Level Status */}
            {hasQuotaAlert && (
              <div className="space-y-1">
                <div className="text-muted-foreground text-xs">
                  {t('Alert Status')}:
                </div>
                <div className="flex gap-1 text-xs">
                  {/* Use cn utility function to handle class names */}
                  <span
                    className={cn(
                      'rounded px-2 py-1',
                      quotaAlert.alertLevel80Sent
                        ? 'bg-yellow-100 text-yellow-700'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    80%
                  </span>
                  <span
                    className={cn(
                      'rounded px-2 py-1',
                      quotaAlert.alertLevel100Sent
                        ? 'bg-orange-100 text-orange-700'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    100%
                  </span>
                  <span
                    className={cn(
                      'rounded px-2 py-1',
                      quotaAlert.alertLevel150Sent
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-500'
                    )}
                  >
                    150%
                  </span>
                </div>
              </div>
            )}

            {quotaAlert.lastAlertSentAt && (
              <div className="text-muted-foreground text-xs">
                {t('Last alert sent')}:{' '}
                {dayjs(quotaAlert.lastAlertSentAt).format('MM-DD HH:mm')}
              </div>
            )}
          </>
        )}

        {!hasQuotaAlert && (
          <div className="py-4 text-center">
            <p className="text-muted-foreground mb-2 text-sm">
              {t('No quota alert configured')}
            </p>
            <Button
              variant="outline"
              size="sm"
              onClick={onOpenQuotaSettings}
              className="text-xs"
            >
              <Settings className="mr-1 h-3 w-3" />
              {t('Set up quota alert')}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
