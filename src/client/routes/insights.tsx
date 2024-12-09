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

  return (
    <Layout>
      <CommonWrapper header={<CommonHeader title={t('Insights')} />}>
        <ResizablePanelGroup
          className="flex-1 items-stretch"
          direction="horizontal"
        >
          <ResizablePanel collapsedSize={1} className={cn('flex flex-col')}>
            <ScrollArea className="h-full overflow-hidden p-4">
              <div>foooooooooo</div>
            </ScrollArea>
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={30}>
            <ScrollArea className="h-full overflow-hidden p-4">
              <div className="flex flex-col space-y-8">
                <MetricsSection title="Metrics" />
                <MetricsSection title="Filters" />
                <MetricsSection title="Breakdown" />
              </div>
            </ScrollArea>
          </ResizablePanel>
        </ResizablePanelGroup>
      </CommonWrapper>
    </Layout>
  );
}
