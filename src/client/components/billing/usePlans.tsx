import { defaultErrorHandler, defaultSuccessHandler, trpc } from '@/api/trpc';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { useTranslation } from '@i18next-toolkit/react';
import { LuCheck } from 'react-icons/lu';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '../ui/button';
import { cn } from '@/utils/style';

export interface UsePlanOptions {
  currentTier: 'FREE' | 'PRO' | 'TEAM' | 'UNLIMITED' | undefined;
  alreadySubscribed: boolean;
  onRefresh: () => void;
}
export function usePlans(options: UsePlanOptions) {
  const workspaceId = useCurrentWorkspaceId();
  const { t } = useTranslation();
  const { currentTier, alreadySubscribed, onRefresh } = options;
  const changePlanMutation = trpc.billing.changePlan.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const checkoutMutation = trpc.billing.checkout.useMutation({
    onError: defaultErrorHandler,
  });

  const handleCheckoutSubscribe = useEvent(
    async (tier: 'free' | 'pro' | 'team') => {
      if (alreadySubscribed) {
        await changePlanMutation.mutateAsync({
          workspaceId,
          tier,
        });

        onRefresh();
      } else {
        const { url } = await checkoutMutation.mutateAsync({
          workspaceId,
          tier,
          redirectUrl: location.href,
        });

        location.href = url;
      }
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
    <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
      {plans.map((plan) => {
        const isCurrent = plan.id === currentTier;

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
                    <LuCheck className="mr-2 h-4 w-4 text-green-500" />
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
                      plans.findIndex((p) => p.id === currentTier)
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
  );
}
