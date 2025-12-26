import React from 'react';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { useTranslation } from '@i18next-toolkit/react';
import { LuArrowRight, LuInfo } from 'react-icons/lu';
import { useCurrentWorkspaceId } from '@/store/user';
import { trpc } from '@/api/trpc';
import { Button } from './ui/button';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useNavigate } from '@tanstack/react-router';
import { useLocalStorageState } from 'ahooks';
import { useGlobalConfig } from '@/hooks/useConfig';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';

interface FreeTierTipProps {
  isCollapsed: boolean;
}
export const FreeTierTip: React.FC<FreeTierTipProps> = React.memo((props) => {
  const { isCollapsed } = props;
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const { data: currentTier } = trpc.billing.currentTier.useQuery({
    workspaceId: workspaceId,
  });
  const { enableBilling } = useGlobalConfig();
  const isMobile = useIsMobile();
  const navigate = useNavigate();
  const [ignored, setIgnored] = useLocalStorageState('tianji-free-tip-ignore', {
    defaultValue: false,
  });

  if (!enableBilling) {
    return null;
  }

  if (currentTier !== 'FREE') {
    return null;
  }

  if (isMobile) {
    return null;
  }

  if (ignored == true) {
    return null;
  }

  const card = (
    <Alert>
      <LuInfo className="h-4 w-4" />
      <AlertTitle>{t('Tip')}</AlertTitle>
      <AlertDescription>
        {t(
          'You are currently using the FREE plan. Upgrade to a higher plan to get more quota.'
        )}
      </AlertDescription>

      <div className="flex justify-end gap-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIgnored(true);
          }}
        >
          {t('Ignore')}
        </Button>

        <Button
          variant="outline"
          size="sm"
          iconType="right"
          Icon={LuArrowRight}
          onClick={() => {
            navigate({
              to: '/settings/billing',
            });
          }}
        >
          {t('Billing')}
        </Button>
      </div>
    </Alert>
  );

  if (isCollapsed) {
    return (
      <Popover>
        <PopoverTrigger asChild>
          <Button Icon={LuInfo} variant="outline" size="icon" />
        </PopoverTrigger>
        <PopoverContent asChild>{card}</PopoverContent>
      </Popover>
    );
  }

  return card;
});
FreeTierTip.displayName = 'FreeTierTip';
