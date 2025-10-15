import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
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
import { Button } from '@/components/ui/button';
import { LuShare2 } from 'react-icons/lu';
import { serializeInsightsState } from '@/utils/insights';
import copy from 'copy-to-clipboard';
import { toast } from 'sonner';
import { useState } from 'react';

export const Route = createFileRoute('/insights/')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();

  const insightId = useInsightsStore((state) => state.insightId);
  const insightType = useInsightsStore((state) => state.insightType);
  const setInsightTarget = useInsightsStore((state) => state.setInsightTarget);
  const currentFilters = useInsightsStore((state) => state.currentFilters);
  const currentMetrics = useInsightsStore((state) => state.currentMetrics);
  const currentGroups = useInsightsStore((state) => state.currentGroups);
  const currentDateKey = useInsightsStore((state) => state.currentDateKey);
  const currentDateRange = useInsightsStore((state) => state.currentDateRange);
  const currentDateUnit = useInsightsStore((state) => state.currentDateUnit);
  const currentChartType = useInsightsStore((state) => state.currentChartType);
  const setFilter = useInsightsStore((state) => state.setFilter);
  const addFilter = useInsightsStore((state) => state.addFilter);
  const removeFilter = useInsightsStore((state) => state.removeFilter);
  const { data: websites = [] } = trpc.website.all.useQuery({ workspaceId });
  const { data: surveys = [] } = trpc.survey.all.useQuery({ workspaceId });
  const { data: warehouseApplicationIds = [] } =
    trpc.insights.warehouseApplications.useQuery({ workspaceId });

  const [isSharing, setIsSharing] = useState(false);
  const createShortLinkMutation = trpc.shortlink.create.useMutation();

  const handleValueChange = useEvent((insightId: string) => {
    const insightType = surveys.some((item) => item.id === insightId)
      ? 'survey'
      : warehouseApplicationIds.some((item) => item === insightId)
        ? 'warehouse'
        : 'website';

    setInsightTarget(insightId, insightType);
  });

  const handleShare = useEvent(async () => {
    if (!insightId) {
      return;
    }

    setIsSharing(true);
    try {
      // Serialize current insights state
      const serializedState = serializeInsightsState({
        insightId,
        insightType,
        currentMetrics,
        currentFilters,
        currentGroups,
        currentDateKey,
        currentDateRange,
        currentDateUnit,
        currentChartType,
      });

      // Build full URL with query parameter
      const origin =
        typeof window !== 'undefined' ? window.location.origin : '';
      const fullUrl = `${origin}/insights?query=${encodeURIComponent(serializedState)}`;

      // Create short link
      const shortLink = await createShortLinkMutation.mutateAsync({
        workspaceId,
        originalUrl: fullUrl,
        title: `Insights: ${insightId}`,
      });

      // Build short link URL
      const shortUrl = `${origin}/s/${shortLink.code}`;

      // Copy to clipboard
      copy(shortUrl);
      toast.success(t('Share link copied to clipboard'));
    } catch (error) {
      console.error('Failed to create share link:', error);
      toast.error(t('Failed to create share link'));
    } finally {
      setIsSharing(false);
    }
  });

  return (
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
                  {websites.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>{t('Websites')}</SelectLabel>

                      {websites.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}

                  {surveys.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>{t('Surveys')}</SelectLabel>
                      {surveys.map((item) => (
                        <SelectItem key={item.id} value={item.id}>
                          {item.name}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}

                  {warehouseApplicationIds.length > 0 && (
                    <SelectGroup>
                      <SelectLabel>{t('Warehouse')}</SelectLabel>
                      {warehouseApplicationIds.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  )}
                </SelectContent>
              </Select>

              {insightId && (
                <Button
                  size="icon"
                  variant="outline"
                  onClick={handleShare}
                  disabled={isSharing}
                  aria-label={t('Share')}
                >
                  <LuShare2 />
                </Button>
              )}
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
                <FilterSection
                  direction="vertical"
                  insightId={insightId}
                  insightType={insightType}
                  filters={currentFilters}
                  onSetFilter={setFilter}
                  onAddFilter={addFilter}
                  onRemoveFilter={removeFilter}
                />
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
  );
}
