import React from 'react';
import { Badge } from './ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from './ui/tooltip';
import { useTranslation } from '@i18next-toolkit/react';

interface DeprecatedBadgeProps {
  tip?: string;
}

export const DeprecatedBadge: React.FC<DeprecatedBadgeProps> = React.memo(
  (props) => {
    const { t } = useTranslation();

    const el = (
      <Badge className="mx-1 px-1 py-0.5 text-xs" variant="secondary">
        {t('Deprecated')}
      </Badge>
    );

    if (!props.tip) {
      return el;
    } else {
      return (
        <Tooltip>
          <TooltipTrigger>{el}</TooltipTrigger>
          <TooltipContent>
            <p>{props.tip}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
  }
);
DeprecatedBadge.displayName = 'DeprecatedBadge';
