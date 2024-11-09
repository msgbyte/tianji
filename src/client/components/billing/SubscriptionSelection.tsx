import { Check } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { cn } from '@/utils/style';
import { Alert, AlertDescription, AlertTitle } from '../ui/alert';
import { LuInfo } from 'react-icons/lu';

interface SubscriptionSelectionProps {
  tier: 'FREE' | 'PRO' | 'TEAM' | 'UNLIMITED' | undefined;
}
export const SubscriptionSelection: React.FC<SubscriptionSelectionProps> =
  React.memo((props) => {
    const { tier } = props;
    const workspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation();

    const checkoutMutation = trpc.billing.checkout.useMutation({
      onError: defaultErrorHandler,
    });

    const handleCheckoutSubscribe = useEvent(
      async (tier: 'free' | 'pro' | 'team') => {
        const { url } = await checkoutMutation.mutateAsync({
          workspaceId,
          tier,
          redirectUrl: location.href,
        });

        location.href = url;
      }
    );

    const plans = [
      {
        id: 'FREE',
        name: t('Free'),
        price: 0,
        features: [
          t('Basic trial'),
          t('Basic Usage'),
          t('Up to 3 websites'),
          t('Up to 3 surveys'),
          t('Up to 3 feed channels'),
          t('100K website events per month'),
          t('100K monitor execution per month'),
          t('10K feed event per month'),
          t('Discord Community Support'),
        ],
        onClick: () => handleCheckoutSubscribe('free'),
      },
      {
        id: 'PRO',
        name: 'Pro',
        price: 19.99,
        features: [
          t('Sufficient for most situations'),
          t('Priority access to advanced features'),
          t('Up to 10 websites'),
          t('Up to 20 surveys'),
          t('Up to 20 feed channels'),
          t('1M website events per month'),
          t('1M monitor execution per month'),
          t('100K feed events per month'),
          t('Discord Community Support'),
        ],
        onClick: () => handleCheckoutSubscribe('pro'),
      },
      {
        id: 'TEAM',
        name: 'Team',
        price: 99.99,
        features: [
          t('Fully sufficient'),
          t('Priority access to advanced features'),
          t('Unlimited websites'),
          t('Unlimited surveys'),
          t('Unlimited feed channels'),
          t('20M website events per month'),
          t('20M monitor execution per month'),
          t('1M feed events per month'),
          t('Priority email support'),
        ],
        onClick: () => handleCheckoutSubscribe('team'),
      },
    ];

    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="mb-8 text-center text-3xl font-bold">
          {t('Subscription Plan')}
        </h1>

        <Alert className="mb-4">
          <LuInfo className="h-4 w-4" />
          <AlertTitle>{t('Current Plan')}</AlertTitle>
          <AlertDescription>
            {t('Your Current Plan is:')}{' '}
            <span className="font-bold">{tier}</span>
          </AlertDescription>
        </Alert>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {plans.map((plan) => {
            const isCurrent = plan.id === tier;

            return (
              <Card
                key={plan.name}
                className={cn('flex flex-col', isCurrent && 'border-primary')}
              >
                <CardHeader>
                  <CardTitle>{plan.name}</CardTitle>
                  <CardDescription>${plan.price} per month</CardDescription>
                </CardHeader>
                <CardContent className="flex-grow">
                  <ul className="space-y-2">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center">
                        <Check className="mr-2 h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  {isCurrent ? (
                    <Button className="w-full" disabled variant="outline">
                      {t('Current')}
                    </Button>
                  ) : (
                    <Button
                      className="w-full"
                      disabled={checkoutMutation.isLoading}
                      onClick={plan.onClick}
                    >
                      {t('{{action}} to {{plan}}', {
                        action:
                          plans.indexOf(plan) <
                          plans.findIndex((p) => p.id === tier)
                            ? t('Downgrade')
                            : t('Upgrade'),
                        plan: plan.name,
                      })}
                    </Button>
                  )}
                </CardFooter>
              </Card>
            );
          })}
        </div>
      </div>
    );
  });
SubscriptionSelection.displayName = 'SubscriptionSelection';
