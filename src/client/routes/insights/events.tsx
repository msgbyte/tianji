import { createFileRoute } from '@tanstack/react-router';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useCurrentWorkspaceId } from '@/store/user';
import { useInsightsStore } from '@/store/insights';
import { trpc } from '@/api/trpc';
import dayjs, { Dayjs } from 'dayjs';
import { useMemo, useState } from 'react';
import { Collapse, DatePicker, Empty, Spin } from 'antd';
import { FilterSection } from '@/components/insights/FilterSection';
import { useTranslation } from '@i18next-toolkit/react';
import { Layout } from '@/components/layout';
import { CommonWrapper } from '@/components/CommonWrapper';
import { CommonHeader } from '@/components/CommonHeader';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useEvent } from '@/hooks/useEvent';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cleanObject } from '@/utils/common';
import { Switch } from '@/components/ui/switch';
import Identicon from 'react-identicons';

export const Route = createFileRoute('/insights/events')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const insightId = useInsightsStore((state) => state.insightId);
  const insightType = useInsightsStore((state) => state.insightType);
  const filters = useInsightsStore((state) =>
    state.currentFilters.filter((f): f is NonNullable<typeof f> => !!f)
  );
  const { data: websites = [] } = trpc.website.all.useQuery({ workspaceId });

  // Date range state
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(7, 'day').startOf('day'),
    dayjs().endOf('day'),
  ]);

  // JSON mode state
  const [jsonMode, setJsonMode] = useState(false);

  const handleValueChange = useEvent((value: string) => {
    const type = 'website';

    useInsightsStore.setState({
      insightId: value,
      insightType: type,
    });
  });

  // Query params for trpc
  const queryParams = useMemo(
    () => ({
      workspaceId,
      insightId,
      insightType,
      metrics: [{ name: '$all_event', math: 'events' as const }], // Only support 'events' or 'sessions'
      filters,
      groups: [],
      time: {
        startAt: dateRange[0].valueOf(),
        endAt: dateRange[1].valueOf(),
        unit: 'day' as const,
      },
    }),
    [workspaceId, insightId, insightType, filters, dateRange]
  );

  // Query events
  const { data = [], isFetching } = trpc.insights.queryEvents.useQuery(
    queryParams,
    {
      enabled: Boolean(insightId),
    }
  );

  // Render event properties as grid
  function renderGrid(properties: Record<string, any> | null) {
    const entries = Object.entries(properties ?? {});
    return (
      <div className="rounded p-2 text-xs">
        {entries.length === 0 ? (
          <div className="text-muted-foreground py-2 text-center">No Data</div>
        ) : (
          <div className="grid grid-cols-1 gap-2 md:grid-cols-3">
            {entries.map(([key, value]) => (
              <div key={key} className="p-2">
                <div className="flex justify-between">
                  <div className="text-sm">{key}</div>
                  <div className="text-muted-foreground text-xs">
                    {typeof value}
                  </div>
                </div>
                <div className="text-foreground mt-1 break-all font-bold">
                  {String(value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Render event list
  return (
    <Layout>
      <CommonWrapper
        header={
          <CommonHeader
            title={
              <div className="flex items-center gap-2">
                <div>{t('Event List')}</div>

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
                  </SelectContent>
                </Select>
              </div>
            }
          />
        }
      >
        <div className="mx-auto flex h-full flex-col overflow-hidden p-4">
          <div className="mb-4 flex items-center gap-2 md:flex-row">
            <span>{t('Date Range')}：</span>
            <DatePicker.RangePicker
              value={dateRange}
              onChange={(val) => {
                if (val && val[0] && val[1]) {
                  setDateRange([
                    dayjs(val[0]).startOf('day'),
                    dayjs(val[1]).endOf('day'),
                  ]);
                }
              }}
              allowClear={false}
            />
            <div className="flex-1" />
            <FilterSection />
            {/* Switch for JSON/Grid mode */}
            <div className="ml-4 flex items-center gap-1">
              <span className="text-xs text-gray-500">Grid</span>
              <Switch checked={jsonMode} onCheckedChange={setJsonMode} />
              <span className="text-xs text-gray-500">JSON</span>
            </div>
          </div>

          <ScrollArea className="flex-1 overflow-hidden">
            {isFetching ? (
              <div className="flex h-40 items-center justify-center">
                <Spin />
              </div>
            ) : data.length === 0 ? (
              <Empty description={t('No event data yet')} />
            ) : (
              <Collapse accordion>
                {data.map((event) => {
                  // Calculate date difference
                  const eventDate = dayjs(event.createdAt);
                  const diffNow = eventDate.isValid()
                    ? eventDate.fromNow()
                    : '';

                  // Get user ID
                  const userId =
                    event.properties.userId ||
                    event.properties.user_id ||
                    event.properties.sessionId ||
                    '';

                  // Clean properties and sessions objects to remove falsy values
                  const cleanedProperties = cleanObject(event.properties);
                  const cleanedSessions = cleanObject(event.sessions);

                  return (
                    <Collapse.Panel
                      header={
                        <div className="flex flex-col gap-1">
                          <div className="flex w-full items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">
                                {event.name}
                              </span>
                            </div>

                            <div className="overflow-hidden rounded-sm bg-white p-0.5">
                              {userId && (
                                <div title={userId}>
                                  <Identicon string={userId} size={20} />
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="text-muted-foreground flex items-center gap-2 text-xs">
                            {eventDate.isValid() && (
                              <>
                                <span>
                                  {eventDate.format('YYYY-MM-DD HH:mm:ss')}
                                </span>
                                <span>({diffNow})</span>
                              </>
                            )}
                          </div>
                        </div>
                      }
                      key={event.id}
                    >
                      {jsonMode ? (
                        <pre className="overflow-x-auto rounded p-2 text-xs">
                          {JSON.stringify(
                            {
                              ...cleanedSessions,
                              ...cleanedProperties,
                            },
                            null,
                            2
                          )}
                        </pre>
                      ) : (
                        <Tabs defaultValue="all" className="w-full">
                          <TabsList className="mb-2">
                            <TabsTrigger value="all">{t('All')}</TabsTrigger>
                            <TabsTrigger value="event">
                              {t('Event')}
                            </TabsTrigger>
                            <TabsTrigger value="session">
                              {t('Session')}
                            </TabsTrigger>
                          </TabsList>
                          <TabsContent value="all">
                            {renderGrid({
                              ...cleanedSessions,
                              ...cleanedProperties,
                            })}
                          </TabsContent>
                          <TabsContent value="event">
                            {renderGrid(cleanedProperties)}
                          </TabsContent>
                          <TabsContent value="session">
                            {renderGrid(cleanedSessions)}
                          </TabsContent>
                        </Tabs>
                      )}
                    </Collapse.Panel>
                  );
                })}
              </Collapse>
            )}
          </ScrollArea>
        </div>
      </CommonWrapper>
    </Layout>
  );
}
