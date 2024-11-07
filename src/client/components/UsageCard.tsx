import React from 'react';
import { Card, CardContent, CardHeader } from './ui/card';
import { formatNumber } from '@/utils/common';
import { LuAlertCircle } from 'react-icons/lu';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useTranslation } from '@i18next-toolkit/react';
import colors from 'tailwindcss/colors';

interface UsageCardProps {
  title: string;
  current: number;
  limit?: number;
}
export const UsageCard: React.FC<UsageCardProps> = React.memo((props) => {
  const { title, current, limit } = props;
  const { t } = useTranslation();

  return (
    <Card className="relative h-full w-full overflow-hidden">
      {limit && (
        <div
          className="absolute h-full bg-black bg-opacity-5 dark:bg-white dark:bg-opacity-10"
          style={{ width: `${(current / limit) * 100}%` }}
        />
      )}

      {limit && current > limit && (
        <div className="absolute right-2 top-2">
          <Tooltip>
            <TooltipTrigger>
              <LuAlertCircle stroke={colors.red['500']} />
            </TooltipTrigger>
            <TooltipContent>
              <div>
                {t(
                  'Exceeded the limit, please upgrade your plan or your workspace will be paused soon.'
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </div>
      )}

      <CardHeader className="text-muted-foreground">{title}</CardHeader>
      <CardContent>
        {limit && limit >= 0 ? (
          <div>
            <span className="text-2xl font-bold">{formatNumber(current)}</span>{' '}
            / <span>{formatNumber(limit)}</span>
          </div>
        ) : (
          <div>
            <span className="text-2xl font-bold">{formatNumber(current)}</span>{' '}
            / <span>∞</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
});
UsageCard.displayName = 'UsageCard';
