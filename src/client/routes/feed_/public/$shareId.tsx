import { AppRouterOutput, trpc } from '@/api/trpc';
import { FeedEventItem } from '@/components/feed/FeedEventItem';
import { Loading } from '@/components/Loading';
import { NotFoundTip } from '@/components/NotFoundTip';
import { ErrorTip } from '@/components/ErrorTip';
import { DynamicVirtualList } from '@/components/DynamicVirtualList';
import { Button } from '@/components/ui/button';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute } from '@tanstack/react-router';
import { useEffect, useMemo, useState } from 'react';
import { get } from 'lodash-es';
import { PieChart, Pie, Cell } from 'recharts';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { LuRefreshCcw, LuVolume2, LuVolumeX, LuPlay } from 'react-icons/lu';
import { useTTSAnnouncement } from '@/hooks/useTTSAnnouncement';

export const Route = createFileRoute('/feed/public/$shareId')({
  component: PageComponent,
});

type PublicFeedItem =
  AppRouterOutput['feed']['fetchPublicEventsByCursor']['items'][number];

function PageComponent() {
  const { shareId } = Route.useParams<{ shareId: string }>();
  const { t } = useTranslation();

  const {
    data: channel,
    isLoading: isChannelLoading,
    error: channelError,
  } = trpc.feed.getChannelByShareId.useQuery({ shareId });

  const [refreshInterval, setRefreshInterval] = useState<number>(10000);
  const [remainingMs, setRemainingMs] = useState<number>(10000);

  const {
    data,
    isLoading: isEventLoading,
    hasNextPage,
    fetchNextPage,
    isFetchingNextPage,
    refetch,
    dataUpdatedAt,
  } = trpc.feed.fetchPublicEventsByCursor.useInfiniteQuery(
    {
      shareId,
    },
    {
      enabled: !!channel,
      getNextPageParam: (lastPage) => lastPage.nextCursor,
      refetchOnWindowFocus: false,
      refetchInterval: refreshInterval === 0 ? false : refreshInterval,
    }
  );

  useEffect(() => {
    if (refreshInterval === 0) {
      setRemainingMs(0);
      return;
    }
    setRemainingMs(refreshInterval);
  }, [refreshInterval]);

  useEffect(() => {
    if (refreshInterval === 0) {
      return;
    }
    setRemainingMs(refreshInterval);
  }, [dataUpdatedAt, refreshInterval]);

  useEffect(() => {
    if (refreshInterval === 0) {
      return;
    }

    const tick = 200;
    const timer = window.setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - tick;
        return next > 0 ? next : refreshInterval;
      });
    }, tick);

    return () => {
      window.clearInterval(timer);
    };
  }, [refreshInterval]);

  const events = useMemo(
    () => data?.pages.flatMap((page) => page.items) ?? [],
    [data]
  );

  const {
    isTTSEnabled,
    toggleTTS,
    isSpeaking,
    availableVoices,
    selectedVoiceURI,
    setSelectedVoiceURI,
    testSpeak,
  } = useTTSAnnouncement({
    items: events.map((event) => ({
      id: event.id,
      content: event.eventContent,
    })),
  });

  const handleRefreshIntervalChange = (value: string) => {
    const next = Number(value);
    setRefreshInterval(next);
  };

  if (isChannelLoading) {
    return <Loading />;
  }

  if (channelError) {
    if (channelError.data?.code === 'NOT_FOUND') {
      return <NotFoundTip />;
    }
    return <ErrorTip />;
  }

  if (!channel) {
    return <NotFoundTip />;
  }

  return (
    <div className="mx-auto flex h-full max-w-4xl flex-col gap-3 p-3">
      <div className="bg-card flex flex-col gap-4 rounded-lg border p-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <h1 className="text-2xl font-bold">{channel.name}</h1>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            {refreshInterval !== 0 && (
              <div className="flex items-center">
                <PieChart width={20} height={20} className="text-xs">
                  <Pie
                    data={getCountdownData(remainingMs, refreshInterval)}
                    innerRadius={7}
                    outerRadius={10}
                    dataKey="value"
                    stroke="none"
                  >
                    <Cell fill="hsl(var(--primary))" />
                    <Cell fill="hsl(var(--muted))" />
                  </Pie>
                </PieChart>
              </div>
            )}

            <Select
              value={refreshInterval.toString()}
              onValueChange={handleRefreshIntervalChange}
            >
              <SelectTrigger className="w-40">
                <SelectValue placeholder={t('Auto refresh')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="0">{t('Manual')}</SelectItem>
                <SelectItem value="5000">{t('5s')}</SelectItem>
                <SelectItem value="10000">{t('10s')}</SelectItem>
                <SelectItem value="30000">{t('30s')}</SelectItem>
                <SelectItem value="60000">{t('60s')}</SelectItem>
              </SelectContent>
            </Select>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="icon"
                  variant="outline"
                  aria-label={t('TTS Announcement')}
                  className={isSpeaking ? 'animate-pulse' : ''}
                >
                  {isTTSEnabled ? (
                    <LuVolume2 className="h-4 w-4" />
                  ) : (
                    <LuVolumeX className="h-4 w-4" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h4 className="font-medium leading-none">
                      {t('Voice Settings')}
                    </h4>
                    <p className="text-muted-foreground text-sm">
                      {t('Configure text-to-speech options')}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      {t('Enable TTS')}
                    </label>
                    <Button
                      variant={isTTSEnabled ? 'default' : 'outline'}
                      className="w-full"
                      onClick={toggleTTS}
                    >
                      {isTTSEnabled ? t('Enabled') : t('Disabled')}
                    </Button>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">{t('Voice')}</label>
                    <Select
                      value={selectedVoiceURI}
                      onValueChange={setSelectedVoiceURI}
                      disabled={availableVoices.length === 0}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={
                            availableVoices.length === 0
                              ? t('No voices available')
                              : t('Select a voice')
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {availableVoices.map((voice) => (
                          <SelectItem
                            key={voice.voiceURI}
                            value={voice.voiceURI}
                          >
                            {voice.name} ({voice.lang})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Button
                      variant="secondary"
                      className="w-full"
                      size="sm"
                      onClick={() => {
                        const latestEvent = events[0];
                        const testText =
                          latestEvent?.eventContent || 'Hello World';
                        testSpeak(testText);
                      }}
                      disabled={availableVoices.length === 0 || isSpeaking}
                    >
                      <LuPlay className="mr-2 h-4 w-4" />
                      {t('Test Voice')}
                    </Button>
                  </div>
                </div>
              </PopoverContent>
            </Popover>

            <Button
              size="icon"
              variant="outline"
              onClick={() => refetch()}
              aria-label={t('Refresh')}
            >
              <LuRefreshCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      <div className="bg-card flex-1 rounded-lg border p-4 shadow-sm">
        {isEventLoading && events.length === 0 ? (
          <Loading />
        ) : (
          <DynamicVirtualList
            allData={events}
            estimateSize={100}
            hasNextPage={hasNextPage}
            isFetchingNextPage={isFetchingNextPage}
            onFetchNextPage={fetchNextPage}
            getItemKey={(index) => get(events, [index, 'id'])}
            renderItem={(item: PublicFeedItem) => (
              <FeedEventItem className="animate-fade-in mb-2" event={item} />
            )}
            renderEmpty={() => (
              <div className="text-muted-foreground p-8 text-center">
                {t('No events yet')}
              </div>
            )}
          />
        )}
      </div>
    </div>
  );
}

function getCountdownData(remainingMs: number, totalMs: number) {
  const safeTotal = totalMs > 0 ? totalMs : 1;
  const clampedRemaining = Math.min(Math.max(remainingMs, 0), safeTotal);
  const elapsed = safeTotal - clampedRemaining;

  return [
    { name: 'elapsed', value: elapsed || 0.0001 },
    { name: 'remaining', value: clampedRemaining || 0.0001 },
  ];
}
