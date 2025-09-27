import { useTranslation } from '@i18next-toolkit/react';
import { LuCoins } from 'react-icons/lu';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/spinner';
import { TipIcon } from '@/components/TipIcon';
import { useCurrentWorkspaceId } from '@/store/user';
import { trpc } from '@/api/trpc';
import React from 'react';

interface CreditBalanceCardProps {
  className?: string;
  refetchInterval?: number;
}

export const CreditBalanceCard: React.FC<CreditBalanceCardProps> = React.memo(
  ({ className, refetchInterval }: CreditBalanceCardProps) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();

    const { data, isLoading } = trpc.billing.credit.useQuery(
      {
        workspaceId,
      },
      {
        enabled: Boolean(workspaceId),
        refetchInterval,
      }
    );

    return (
      <Card className={className}>
        <CardHeader className="flex flex-row items-center justify-between">
          <div className="flex items-center gap-2">
            <LuCoins className="h-4 w-4" />
            <CardTitle className="text-sm font-medium">
              {t('Available Credits')}
            </CardTitle>
            <TipIcon
              content={t(
                'Workspace credits can be consumed when using Tianji AI features.'
              )}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground flex items-center gap-2">
              <Spinner className="h-4 w-4" />
              {t('Loading...')}
            </div>
          ) : (
            <div className="text-2xl font-semibold">{data?.credit ?? 0}</div>
          )}
        </CardContent>
      </Card>
    );
  }
);
CreditBalanceCard.displayName = 'CreditBalanceCard';
