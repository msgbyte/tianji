import { createFileRoute } from '@tanstack/react-router';
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
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { useInsightsStore } from '@/store/insights';
import { ChartRender } from '@/components/insights/ChartRender';
import { FilterSection } from '@/components/insights/FilterSection';
import { useEvent } from '@/hooks/useEvent';
import { BreakdownSection } from '@/components/insights/BreakdownSection';

export const Route = createFileRoute('/insights')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();

  const insightId = useInsightsStore((state) => state.insightId);
  const insightType = useInsightsStore((state) => state.insightType);
  const { data: websites = [] } = trpc.website.all.useQuery({ workspaceId });
  const { data: surveys = [] } = trpc.survey.all.useQuery({ workspaceId });

  const handleValueChange = useEvent((value: string) => {
    const type = surveys.some((item) => item.id === value)
      ? 'survey'
      : 'website';
    useInsightsStore.setState({
      insightId: value,
      insightType: type,
    });
  });

  return (
    <Layout>
      <CommonWrapper
        header={
          <CommonHeader
            title={
              <div className="flex items-center gap-2">
                <div>{t('Insights')}</div>

                <Select value={insightId} onValueChange={handleValueChange}>
                  <SelectTrigger className="w-[240px]">
                    <SelectValue placeholder={t('Please select target')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectGroup>
                      <SelectLabel>{t('Websites')}</SelectLabel>
                      {websites.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                    <SelectGroup>
                      <SelectLabel>{t('Surveys')}</SelectLabel>
                      {surveys.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
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
            {insightId ? (
              <ChartRender insightId={insightId} insightType={insightType} />
            ) : (
              <div className="mt-4 text-center opacity-80">
                {t('Please select target first')}
              </div>
            )}
          </ResizablePanel>

          <ResizableHandle withHandle />

          <ResizablePanel defaultSize={30}>
            {insightId ? (
              <ScrollArea className="h-full overflow-hidden p-4">
                <div className="flex flex-col space-y-8">
                  <MetricsSection />
                  <FilterSection />
                  <BreakdownSection />
                </div>
              </ScrollArea>
            ) : (
              <div className="mt-4 text-center opacity-80">
                {t('Please select target first')}
              </div>
            )}
          </ResizablePanel>
        </ResizablePanelGroup>
      </CommonWrapper>
    </Layout>
  );
}
