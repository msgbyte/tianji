import { createFileRoute, redirect } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Layout } from '@/components/layout';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable';
import { cn } from '@/utils/style';
import { MetricsSection } from '@/components/insights/MetricsSection';
import { isDev } from '@/utils/env';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useState } from 'react';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { useInsightsStore } from '@/store/insights';
import { ChartRender } from '@/components/insights/ChartRender';

export const Route = createFileRoute('/insights')({
  beforeLoad: (opts) => {
    if (!isDev) {
      throw redirect({
        to: '/',
      });
    }

    return routeAuthBeforeLoad?.(opts);
  },
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();

  const selectedWebsiteId = useInsightsStore(
    (state) => state.selectedWebsiteId
  );
  const { data = [] } = trpc.website.all.useQuery({ workspaceId });

  return (
    <Layout>
      <CommonWrapper
        header={
          <CommonHeader
            title={
              <div className="flex items-center gap-2">
                <div>{t('Insights')}</div>

                <Select
                  value={selectedWebsiteId}
                  onValueChange={(value) => {
                    useInsightsStore.setState({
                      selectedWebsiteId: value,
                    });
                  }}
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder={t('Please select website')} />
                  </SelectTrigger>
                  <SelectContent>
                    {data.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            }
          />
        }
      >
        <ResizablePanelGroup
          className="flex-1 items-stretch"
          direction="horizontal"
        >
          <ResizablePanel collapsedSize={1} className={cn('flex flex-col')}>
            {selectedWebsiteId ? (
              <ChartRender websiteId={selectedWebsiteId} />
            ) : (
              <div>{t('Please select website first')}</div>
            )}
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={30}>
            <ScrollArea className="h-full overflow-hidden p-4">
              <div className="flex flex-col space-y-8">
                <MetricsSection title="Metrics" />
                {/* <MetricsSection title="Filters" />
                <MetricsSection title="Breakdown" /> */}
              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </CommonWrapper>
    </Layout>
  );
}
