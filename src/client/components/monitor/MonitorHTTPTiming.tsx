import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Clock,
  Globe,
  Zap,
  Shield,
  Activity,
  Download,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { useTranslation } from '@i18next-toolkit/react';
import { cn } from '@/utils/style';

interface MonitorHTTPTimingProps {
  monitorId: string;
}

interface RequestTimings {
  /** DNS lookup time in milliseconds */
  dns: number;
  /** TCP connection time in milliseconds */
  tcp: number;
  /** TLS handshake time in milliseconds */
  tls: number;
  /** Time to first byte (TTFB) in milliseconds */
  ttfb: number;
  /** Download time in milliseconds */
  download: number;
  /** Total request time in milliseconds */
  total: number;
}

export const MonitorHTTPTiming: React.FC<MonitorHTTPTimingProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const { monitorId } = props;
    const workspaceId = useCurrentWorkspaceId();
    const [isExpanded, setIsExpanded] = useState(false);
    const { data, isLoading, error } = trpc.monitor.getStatus.useQuery({
      workspaceId,
      monitorId,
      statusName: 'timings',
    });

    const timingData = data?.payload as RequestTimings | undefined;

    // Extract timing values with safe defaults
    const dns = timingData?.dns ?? 0;
    const tcp = timingData?.tcp ?? 0;
    const tls = timingData?.tls ?? 0;
    const ttfb = timingData?.ttfb ?? 0;
    const download = timingData?.download ?? 0;
    const total = timingData?.total ?? 0;

    // Check if we have any meaningful timing data
    const hasTimingData =
      dns > 0 || tcp > 0 || tls > 0 || ttfb > 0 || download > 0 || total > 0;

    if (isLoading) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('HTTP Timing')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="animate-pulse space-y-4">
              <div className="h-4 w-3/4 rounded bg-gray-200"></div>
              <div className="h-8 rounded bg-gray-200"></div>
              <div className="h-4 w-1/2 rounded bg-gray-200"></div>
            </div>
          </CardContent>
        </Card>
      );
    }

    if (error) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('HTTP Timing')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-destructive py-8 text-center">
              {t('Failed to load timing data')}
            </div>
          </CardContent>
        </Card>
      );
    }

    if (!hasTimingData) {
      return (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('HTTP Timing')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-muted-foreground py-8 text-center">
              <div className="mb-2">{t('No timing data available')}</div>
              {timingData && Object.keys(timingData).length === 0 && (
                <div className="text-muted-foreground text-xs">
                  {t('Received empty timing object')}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      );
    }

    const formatTime = (ms: number) => {
      if (ms === 0) {
        return '0ms';
      }
      if (ms < 1000) {
        return `${ms.toFixed(1)}ms`;
      }
      return `${(ms / 1000).toFixed(2)}s`;
    };

    // Calculate the sequential phases based on the timing relationships
    // According to the server code: dns, tcp, tls are individual durations
    // ttfb is total time to first byte, download is download duration
    const waitingTime = Math.max(0, ttfb - dns - tcp - tls);
    const totalTime = Math.max(total, ttfb + download);

    const phases = [
      {
        key: 'dns',
        label: t('DNS Lookup'),
        icon: Globe,
        color: 'bg-blue-500',
        duration: dns,
      },
      {
        key: 'tcp',
        label: t('TCP Connect'),
        icon: Zap,
        color: 'bg-green-500',
        duration: tcp,
      },
      {
        key: 'tls',
        label: t('TLS Handshake'),
        icon: Shield,
        color: 'bg-yellow-500',
        duration: tls,
      },
      {
        key: 'waiting',
        label: t('Waiting (TTFB)'),
        icon: Activity,
        color: 'bg-orange-500',
        duration: waitingTime,
      },
      {
        key: 'download',
        label: t('Content Download'),
        icon: Download,
        color: 'bg-purple-500',
        duration: download,
      },
    ];

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              {t('HTTP Request Timeline')}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-mono text-lg">
                {formatTime(totalTime)}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
                className="h-8 w-8 p-0"
              >
                <ChevronDown
                  className={cn(
                    'h-4 w-4 transition-transform duration-200',
                    isExpanded && 'rotate-180'
                  )}
                />
              </Button>
            </div>
          </CardTitle>
        </CardHeader>
        <div
          className={cn(
            'overflow-hidden transition-all duration-300 ease-in-out',
            isExpanded ? 'max-h-[1000px]' : 'max-h-20'
          )}
        >
          {/* Collapsed content */}
          <div
            className={cn(
              'transition-all duration-200',
              isExpanded
                ? 'pointer-events-none -translate-y-2 opacity-0'
                : 'translate-y-0 opacity-100'
            )}
          >
            <CardContent>
              <div className="flex items-center justify-between py-2">
                <span className="text-muted-foreground text-sm">
                  {t('Click to view detailed timing breakdown')}
                </span>
                <div className="text-muted-foreground flex items-center gap-4 text-xs">
                  <span>
                    {t('TTFB')}: {formatTime(ttfb)}
                  </span>
                  <span>
                    {t('Download')}: {formatTime(download)}
                  </span>
                </div>
              </div>
            </CardContent>
          </div>

          {/* Expanded content */}
          <div
            className={cn(
              'transition-all duration-200',
              isExpanded
                ? 'translate-y-0 opacity-100'
                : 'pointer-events-none translate-y-2 opacity-0'
            )}
          >
            <CardContent className="space-y-6">
              {/* Timeline visualization - Stacked Chart */}
              <div className="space-y-4">
                <div className="text-muted-foreground text-sm font-medium">
                  {t('Request Timeline')}
                </div>

                {/* Stacked Timeline */}
                <div className="bg-muted relative rounded-lg p-4">
                  <div className="space-y-2">
                    {phases.map((phase, index) => {
                      // Calculate the correct start time for each phase based on fetch.ts logic
                      let phaseStartTime = 0;
                      let phaseEndTime = phase.duration;

                      if (phase.key === 'dns') {
                        phaseStartTime = 0;
                        phaseEndTime = dns;
                      } else if (phase.key === 'tcp') {
                        phaseStartTime = dns;
                        phaseEndTime = dns + tcp;
                      } else if (phase.key === 'tls') {
                        phaseStartTime = dns + tcp;
                        phaseEndTime = dns + tcp + tls;
                      } else if (phase.key === 'waiting') {
                        phaseStartTime = dns + tcp + tls;
                        phaseEndTime = ttfb;
                      } else if (phase.key === 'download') {
                        phaseStartTime = ttfb;
                        phaseEndTime = ttfb + download;
                      }

                      const phaseStartPercentage =
                        totalTime > 0 ? (phaseStartTime / totalTime) * 100 : 0;
                      const phaseWidthPercentage =
                        totalTime > 0 ? (phase.duration / totalTime) * 100 : 0;

                      return (
                        <div key={phase.key} className="relative">
                          {/* Phase bar */}
                          <div className="flex h-7 items-center gap-3">
                            <div className="text-muted-foreground flex w-20 items-center gap-2 text-xs font-medium">
                              <phase.icon className="h-4 w-4 flex-shrink-0" />
                              <span>{phase.label}</span>
                            </div>
                            <div className="relative flex-1">
                              <div className="bg-background relative h-6 overflow-hidden rounded border">
                                {/* Background track */}
                                <div className="bg-muted/30 absolute inset-0"></div>
                                {/* Active phase bar with offset */}
                                <div
                                  className={cn(
                                    'absolute flex h-full items-center justify-center rounded-sm text-xs font-medium text-white transition-all hover:opacity-80',
                                    phase.color
                                  )}
                                  style={{
                                    left: `${phaseStartPercentage}%`,
                                    width: `${phaseWidthPercentage}%`,
                                  }}
                                >
                                  {phaseWidthPercentage > 15 &&
                                    formatTime(phase.duration)}
                                </div>
                              </div>
                              {/* Time markers */}
                              <div
                                className="text-muted-foreground absolute text-[10px]"
                                style={{ left: `${phaseStartPercentage}%` }}
                              >
                                {formatTime(phaseStartTime)}
                              </div>
                              <div
                                className="text-muted-foreground absolute text-[10px]"
                                style={{
                                  left: `${phaseStartPercentage + phaseWidthPercentage}%`,
                                }}
                              >
                                {formatTime(phaseEndTime)}
                              </div>
                            </div>
                            <div className="text-muted-foreground w-16 text-right font-mono text-xs">
                              {formatTime(phase.duration)}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total timeline at bottom */}
                  <div className="border-border mt-4 border-t pt-3">
                    <div className="flex h-8 items-center gap-3">
                      <div className="text-foreground w-20 text-xs font-medium">
                        {t('Total')}
                      </div>
                      <div className="relative flex-1">
                        <div className="bg-foreground/10 h-6 rounded border">
                          <div className="bg-foreground/20 h-full rounded"></div>
                        </div>
                        <div className="text-muted-foreground absolute -top-5 left-0 text-[10px]">
                          0ms
                        </div>
                        <div className="text-muted-foreground absolute -top-5 right-0 text-[10px]">
                          {formatTime(totalTime)}
                        </div>
                      </div>
                      <div className="text-foreground w-16 text-right font-mono text-xs font-bold">
                        {formatTime(totalTime)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Phase details */}
              <div className="space-y-3">
                <div className="text-muted-foreground text-sm font-medium">
                  {t('Phase Breakdown')}
                </div>
                {phases.map((phase, index) => {
                  const startTime = phases
                    .slice(0, index)
                    .reduce((sum, p) => sum + p.duration, 0);
                  const endTime = startTime + phase.duration;
                  const percentage =
                    totalTime > 0
                      ? ((phase.duration / totalTime) * 100).toFixed(1)
                      : '0';

                  return (
                    <div
                      key={phase.key}
                      className="hover:bg-muted/50 flex items-center justify-between rounded-lg px-3 py-2 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className={cn('h-4 w-4 rounded', phase.color)} />
                        <div className="flex items-center gap-2">
                          <phase.icon className="text-muted-foreground h-5 w-5" />
                          <span className="text-sm font-medium">
                            {phase.label}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-4 text-sm">
                        <span className="text-muted-foreground font-mono">
                          {formatTime(startTime)} → {formatTime(endTime)}
                        </span>
                        <Badge
                          variant="outline"
                          className="min-w-[70px] justify-center font-mono text-xs"
                        >
                          {formatTime(phase.duration)} ({percentage}%)
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Summary metrics */}
              <div className="grid grid-cols-2 gap-4 border-t pt-4 md:grid-cols-4">
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-foreground text-lg font-bold">
                    {formatTime(dns + tcp + tls)}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {t('Connection Setup')}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-foreground text-lg font-bold">
                    {formatTime(ttfb)}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {t('Time to First Byte')}
                  </div>
                </div>
                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-foreground text-lg font-bold">
                    {formatTime(download)}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {t('Download Time')}
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-3 text-center">
                  <div className="text-foreground text-lg font-bold">
                    {formatTime(totalTime)}
                  </div>
                  <div className="text-muted-foreground text-xs">
                    {t('Total Time')}
                  </div>
                </div>
              </div>
            </CardContent>
          </div>
        </div>
      </Card>
    );
  }
);
MonitorHTTPTiming.displayName = 'MonitorHTTPTiming';
