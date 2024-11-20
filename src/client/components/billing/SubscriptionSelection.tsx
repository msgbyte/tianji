import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { LuInfo } from 'react-icons/lu';
import { UsePlanOptions, usePlans } from './usePlans';

interface SubscriptionSelectionProps extends UsePlanOptions {}
export const SubscriptionSelection: React.FC<SubscriptionSelectionProps> =
  React.memo((props) => {
    const { t } = useTranslation();

    // const cancelSubscriptionMutation =
    // trpc.billing.cancelSubscription.useMutation({
    //   onSuccess: defaultSuccessHandler,
    //   onError: defaultErrorHandler,
    // });

    const el = usePlans(props);

    return (
      <div className="w-full py-2">
        <h1 className="mb-8 text-center text-3xl font-bold">
          {t('Subscription Plan')}
        </h1>

        <Alert className="mb-4">
          <LuInfo className="h-4 w-4" />
          <AlertTitle>{t('Current Plan')}</AlertTitle>
          <AlertDescription>
            {t('Your Current Plan is:')}{' '}
            <span className="font-bold">{props.currentTier}</span>
          </AlertDescription>
        </Alert>

        {el}
      </div>
    );
  });
SubscriptionSelection.displayName = 'SubscriptionSelection';
