import { createFileRoute, redirect } from '@tanstack/react-router';
import { isDev } from '@/utils/env';
import {
  MonitorStatusPageServiceItem,
  MonitorStatusPageServiceList,
} from '@/components/monitor/StatusPage/ServiceList';
import { useState } from 'react';
import { EditableText } from '@/components/EditableText';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WebhookPlayground } from '@/components/WebhookPlayground';
import React from 'react';
import { defaultErrorHandler, defaultSuccessHandler, trpc } from '@/api/trpc';
import { Button } from '@/components/ui/button';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { Separator } from '@/components/ui/separator';

export const Route = createFileRoute('/playground')({
  beforeLoad: () => {
    if (!isDev) {
      throw redirect({
        to: '/',
      });
    }
  },
  component: PageComponent,
});

function PageComponent() {
  const [list, setList] = useState<MonitorStatusPageServiceItem[]>([
    {
      title: 'Group 1',
      key: 'group1',
      children: [
        {
          key: 'item1',
          id: 'fooo',
          type: 'monitor',
        },
      ],
    },
    {
      title: 'Group 2',
      key: 'group2',
      children: [
        {
          key: 'item2',
          id: 'barr',
          type: 'monitor',
        },
      ],
    },
  ]);

  return (
    <div className="h-full w-full p-4">
      <Tabs defaultValue="billing" className="flex h-full flex-col">
        <div>
          <TabsList>
            <TabsTrigger value="billing">Billing</TabsTrigger>
            <TabsTrigger value="webhook">Webhook</TabsTrigger>
            <TabsTrigger value="misc">Misc</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="billing">
          <BillingPlayground />
        </TabsContent>
        <TabsContent value="webhook" className="flex-1 overflow-hidden">
          <WebhookPlayground />
        </TabsContent>
        <TabsContent value="misc">
          <div>
            <EditableText
              defaultValue="fooooooooo"
              onSave={() => console.log('save')}
            />

            <MonitorStatusPageServiceList value={list} onChange={setList} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export const BillingPlayground: React.FC = React.memo(() => {
  const checkoutMutation = trpc.billing.checkout.useMutation({
    onError: defaultErrorHandler,
  });
  const changePlanMutation = trpc.billing.changePlan.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const cancelSubscriptionMutation =
    trpc.billing.cancelSubscription.useMutation({
      onSuccess: defaultSuccessHandler,
      onError: defaultErrorHandler,
    });
  const workspaceId = useCurrentWorkspaceId();
  const { data, refetch, isInitialLoading, isLoading } =
    trpc.billing.currentSubscription.useQuery({
      workspaceId,
    });

  const handleCheckoutSubscribe = useEvent(async (tier: 'pro' | 'team') => {
    const { url } = await checkoutMutation.mutateAsync({
      workspaceId,
      tier,
      redirectUrl: location.href,
    });

    location.href = url;
  });

  const handleChangeSubscribe = useEvent(
    async (tier: 'free' | 'pro' | 'team') => {
      await changePlanMutation.mutateAsync({
        workspaceId,
        tier,
      });

      refetch();
    }
  );

  const plan = data ? (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <Button
          loading={changePlanMutation.isPending}
          onClick={() => handleChangeSubscribe('free')}
        >
          Change plan to Free
        </Button>
        <Button
          loading={changePlanMutation.isPending}
          onClick={() => handleChangeSubscribe('pro')}
        >
          Change plan to Pro
        </Button>
        <Button
          loading={changePlanMutation.isPending}
          onClick={() => handleChangeSubscribe('team')}
        >
          Change plan to Team
        </Button>
      </div>

      <div>
        <Button
          loading={cancelSubscriptionMutation.isPending}
          onClick={() =>
            cancelSubscriptionMutation.mutateAsync({
              workspaceId,
            })
          }
        >
          Cancel
        </Button>
      </div>
    </div>
  ) : (
    <div className="flex gap-2">
      <Button
        loading={checkoutMutation.isPending}
        onClick={() => handleCheckoutSubscribe('pro')}
      >
        Upgrade to Pro
      </Button>
      <Button
        loading={checkoutMutation.isPending}
        onClick={() => handleCheckoutSubscribe('team')}
      >
        Upgrade to Team
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-2">
      <div>
        <div>Current: {JSON.stringify(data)}</div>

        <Button loading={isLoading} onClick={() => refetch()}>
          Refresh
        </Button>
      </div>

      <Separator className="my-2" />

      {isInitialLoading === false && plan}
    </div>
  );
});
BillingPlayground.displayName = 'BillingPlayground';
