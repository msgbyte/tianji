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
import { MultiSelectPopover } from '@/components/insights/MultiSelectPopover';

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
            <TabsTrigger value="insights">Insights</TabsTrigger>
            <TabsTrigger value="misc">Misc</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="billing">
          <BillingPlayground />
        </TabsContent>
        <TabsContent value="webhook" className="flex-1 overflow-hidden">
          <WebhookPlayground />
        </TabsContent>
        <TabsContent value="insights" className="flex-1 overflow-hidden">
          <MultiSelectExample />
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

// Sample data
const sampleOptions = [
  { value: '19524244142', label: '19524244142' },
  { value: 'ExpertMode', label: 'ExpertMode' },
  { value: 'BasicMode', label: 'Basic Mode' },
  { value: 'AdvancedMode', label: 'Advanced Mode' },
  { value: 'TestMode', label: 'Test Mode' },
  { value: '(not set)', label: '(not set)' },
  { value: '(empty string)', label: '(empty string)' },
  { value: 'ExpertModePreview', label: 'ExpertModePreview' },
];

export const MultiSelectExample: React.FC = () => {
  const [multiSelectedValues, setMultiSelectedValues] = useState<string[]>([]);
  const [singleSelectedValue, setSingleSelectedValue] = useState<string[]>([]);

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold">MultiSelectPopover Examples</h2>

      {/* Multi-select mode example */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Multi-Select Mode</h3>
        <MultiSelectPopover
          label="from"
          placeholder="Select multiple options..."
          options={sampleOptions}
          selectedValues={multiSelectedValues}
          onValueChange={setMultiSelectedValues}
          allowCustomInput={true}
          showSelectAll={true}
        />
        <p className="text-sm text-gray-600">
          Selected:{' '}
          {multiSelectedValues.length > 0
            ? multiSelectedValues.join(', ')
            : 'None'}
        </p>
      </div>

      {/* Single-select mode example */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Single-Select Mode</h3>
        <MultiSelectPopover
          label="filter"
          placeholder="Select an option..."
          options={sampleOptions}
          selectedValues={singleSelectedValue}
          onValueChange={setSingleSelectedValue}
          singleSelect={true}
          allowCustomInput={true}
          showSelectAll={false}
        />
        <p className="text-sm text-gray-600">
          Selected:{' '}
          {singleSelectedValue.length > 0 ? singleSelectedValue[0] : 'None'}
        </p>
      </div>

      {/* Custom trigger example */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Custom Trigger</h3>
        <MultiSelectPopover
          options={sampleOptions}
          selectedValues={multiSelectedValues}
          onValueChange={setMultiSelectedValues}
          allowCustomInput={true}
        >
          <Button variant="outline" className="w-full justify-start">
            {multiSelectedValues.length === 0
              ? 'Click to select options...'
              : `${multiSelectedValues.length} options selected`}
          </Button>
        </MultiSelectPopover>
      </div>

      {/* Disabled state example */}
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">Disabled State</h3>
        <MultiSelectPopover
          label="disabled"
          placeholder="This component is disabled"
          options={sampleOptions}
          selectedValues={['ExpertMode']}
          onValueChange={() => {}}
          disabled={true}
        />
      </div>

      {/* Action buttons */}
      <div className="flex gap-2">
        <Button onClick={() => setMultiSelectedValues([])} variant="outline">
          Clear Multi-Select
        </Button>
        <Button onClick={() => setSingleSelectedValue([])} variant="outline">
          Clear Single-Select
        </Button>
        <Button
          onClick={() => {
            setMultiSelectedValues(['ExpertMode', 'BasicMode']);
            setSingleSelectedValue(['ExpertMode']);
          }}
          variant="outline"
        >
          Set Example Values
        </Button>
      </div>
    </div>
  );
};

MultiSelectExample.displayName = 'MultiSelectExample';
