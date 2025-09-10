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
import { Sparkline } from '@/components/chart/Sparkline';

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
            <TabsTrigger value="sparkline">Sparkline</TabsTrigger>
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
        <TabsContent value="sparkline" className="flex-1 overflow-hidden">
          <SparklineExample />
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

export const SparklineExample: React.FC = () => {
  // Sample data
  const trendingUpData = [1, 3, 2, 8, 5, 12, 9, 15, 18, 25, 22, 30];
  const trendingDownData = [30, 28, 25, 22, 18, 15, 12, 8, 5, 3, 2, 1];
  const volatileData = [10, 15, 8, 20, 5, 25, 12, 18, 6, 22, 9, 16];
  const steadyData = [10, 11, 10, 12, 11, 13, 12, 14, 13, 15, 14, 16];
  const smallData = [5, 8, 3, 12, 7, 15, 9];

  return (
    <div className="space-y-6 p-6">
      <h2 className="mb-4 text-2xl font-bold">Sparkline Component Demo</h2>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Basic Sparkline */}
        <div className="space-y-3 rounded-lg border p-4">
          <h3 className="text-lg font-semibold">Basic Style</h3>
          <p className="text-muted-foreground text-sm">
            Default Sparkline configuration
          </p>
          <div className="flex items-center justify-center">
            <Sparkline data={trendingUpData} />
          </div>
          <p className="text-xs text-gray-500">
            Data: {trendingUpData.join(', ')}
          </p>
        </div>

        {/* Custom Color */}
        <div className="space-y-3 rounded-lg border p-4">
          <h3 className="text-lg font-semibold">Green Trend</h3>
          <p className="text-muted-foreground text-sm">
            Positive trend in green
          </p>
          <div className="flex items-center justify-center">
            <Sparkline data={trendingUpData} color="#10b981" />
          </div>
          <p className="text-xs text-gray-500">Upward trending data</p>
        </div>

        {/* Red Downward Trend */}
        <div className="space-y-3 rounded-lg border p-4">
          <h3 className="text-lg font-semibold">Red Trend</h3>
          <p className="text-muted-foreground text-sm">Downward trend in red</p>
          <div className="flex items-center justify-center">
            <Sparkline data={trendingDownData} color="#ef4444" />
          </div>
          <p className="text-xs text-gray-500">Downward trending data</p>
        </div>

        {/* Large Size */}
        <div className="space-y-3 rounded-lg border p-4 md:col-span-2">
          <h3 className="text-lg font-semibold">Large Size</h3>
          <p className="text-muted-foreground text-sm">
            200x80 pixel dimensions
          </p>
          <div className="flex items-center justify-center">
            <Sparkline
              data={volatileData}
              width={200}
              height={80}
              color="#f59e0b"
            />
          </div>
          <p className="text-xs text-gray-500">Volatile data display</p>
        </div>

        {/* No Gradient */}
        <div className="space-y-3 rounded-lg border p-4">
          <h3 className="text-lg font-semibold">Line Only</h3>
          <p className="text-muted-foreground text-sm">No gradient fill</p>
          <div className="flex items-center justify-center">
            <Sparkline
              data={steadyData}
              showGradient={false}
              color="#6366f1"
              strokeWidth={3}
            />
          </div>
          <p className="text-xs text-gray-500">Steady growth data</p>
        </div>
      </div>

      {/* Metric Cards Example */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold">Usage in Metric Cards</h3>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Total Revenue</p>
                <p className="text-2xl font-bold">$12,345</p>
                <p className="text-xs text-green-600">+15.3%</p>
              </div>
              <Sparkline
                data={trendingUpData}
                color="#10b981"
                width={60}
                height={30}
              />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Page Views</p>
                <p className="text-2xl font-bold">8,934</p>
                <p className="text-xs text-red-600">-5.2%</p>
              </div>
              <Sparkline
                data={trendingDownData}
                color="#ef4444"
                width={60}
                height={30}
              />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm">Conversion Rate</p>
                <p className="text-2xl font-bold">3.2%</p>
                <p className="text-xs text-orange-600">Volatile</p>
              </div>
              <Sparkline
                data={volatileData}
                color="#f59e0b"
                width={60}
                height={30}
              />
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-muted-foreground text-sm">User Growth</p>
                <p className="text-2xl font-bold">1,234</p>
                <p className="text-xs text-blue-600">Stable</p>
              </div>
              <Sparkline
                data={steadyData}
                color="#3b82f6"
                width={60}
                height={30}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Comparison Display */}
      <div className="mt-8">
        <h3 className="mb-4 text-lg font-semibold">
          Multiple Sparklines Comparison
        </h3>
        <div className="flex items-center justify-center gap-8">
          <div className="text-center">
            <div className="mb-2">
              <Sparkline
                data={trendingUpData}
                color="#10b981"
                width={120}
                height={50}
              />
            </div>
            <span className="text-sm font-medium">Upward Trend</span>
          </div>
          <div className="text-center">
            <div className="mb-2">
              <Sparkline
                data={trendingDownData}
                color="#ef4444"
                width={120}
                height={50}
              />
            </div>
            <span className="text-sm font-medium">Downward Trend</span>
          </div>
          <div className="text-center">
            <div className="mb-2">
              <Sparkline
                data={volatileData}
                color="#f59e0b"
                width={120}
                height={50}
              />
            </div>
            <span className="text-sm font-medium">Volatile Data</span>
          </div>
          <div className="text-center">
            <div className="mb-2">
              <Sparkline
                data={steadyData}
                color="#6366f1"
                width={120}
                height={50}
              />
            </div>
            <span className="text-sm font-medium">Steady Growth</span>
          </div>
        </div>
      </div>

      {/* Code Examples */}
      <div className="bg-muted mt-8 rounded-lg p-4">
        <h3 className="mb-2 text-lg font-semibold">Usage Examples</h3>
        <pre className="bg-background overflow-x-auto rounded border p-3 text-sm">
          {`// Basic usage
<Sparkline data={[1, 3, 2, 8, 5, 12, 9, 15]} />

// Custom styling
<Sparkline
  data={[1, 3, 2, 8, 5, 12, 9, 15]}
  width={150}
  height={60}
  color="#10b981"
  strokeWidth={3}
  showGradient={false}
/>

// Usage in metric cards
<div className="metric-card">
  <div className="flex justify-between items-center">
    <div>
      <p className="text-sm text-muted-foreground">Revenue</p>
      <p className="text-2xl font-bold">$12,345</p>
    </div>
    <Sparkline data={revenueData} color="#10b981" />
  </div>
</div>`}
        </pre>
      </div>
    </div>
  );
};

SparklineExample.displayName = 'SparklineExample';
