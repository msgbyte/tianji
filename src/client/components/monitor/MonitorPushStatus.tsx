import React, { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import { Card, Tooltip } from 'antd';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { useTranslation } from '@i18next-toolkit/react';

export const MonitorPushStatus: React.FC<{ monitorId: string }> = React.memo(
  ({ monitorId }) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();

    const { data: monitorData } = trpc.monitor.get.useQuery({
      workspaceId,
      monitorId,
    });

    const { data: lastPushStatusData } = trpc.monitor.getStatus.useQuery(
      {
        workspaceId,
        monitorId,
        statusName: 'lastPush',
      },
      {
        enabled: !!monitorId && !!workspaceId,
      }
    );

    const [currentTime, setCurrentTime] = useState(new Date());
    const [timelineData, setTimelineData] = useState<{
      lastPushTime: Date | null;
      scheduledTime: Date | null;
      timeoutEnd: Date | null;
      status: 'normal' | 'warning' | 'critical' | 'unknown';
      timelineStart: Date | null;
      timelineEnd: Date | null;
      lastPushPosition: number; // Last push time position on timeline (0-100%)
      currentTimePosition: number; // Current time position on timeline (0-100%)
      timeoutPosition: number; // Timeout time position on timeline (0-100%)
      scheduledTimePosition: number; // Scheduled time position on timeline (0-100%)
      timeoutRangeStart: number; // Timeout range start position (0-100%)
      timeoutRangeEnd: number; // Timeout range end position (0-100%)
      timeoutStartTime: Date | null; // Timeout range start time
      timeoutEndTime: Date | null; // Timeout range end time
    }>({
      lastPushTime: null,
      scheduledTime: null,
      timeoutEnd: null,
      status: 'unknown',
      timelineStart: null,
      timelineEnd: null,
      lastPushPosition: 0,
      currentTimePosition: 0,
      timeoutPosition: 100,
      scheduledTimePosition: 50,
      timeoutRangeStart: 40,
      timeoutRangeEnd: 60,
      timeoutStartTime: null,
      timeoutEndTime: null,
    });

    // // Update time
    // useEffect(() => {
    //   const timer = setInterval(() => {
    //     setCurrentTime(new Date());
    //   }, 1000);

    //   return () => clearInterval(timer);
    // }, []);

    useEffect(() => {
      if (!monitorData || !lastPushStatusData) return;

      if (monitorData.type !== 'push') return;

      let lastPushTime: Date | null = null;
      if (
        lastPushStatusData?.payload &&
        typeof lastPushStatusData.payload === 'object' &&
        'lastPushTime' in lastPushStatusData.payload &&
        lastPushStatusData.payload.lastPushTime
      ) {
        lastPushTime = new Date(
          lastPushStatusData.payload.lastPushTime as string
        );
      }

      if (!lastPushTime) return;

      // Get timeout and cron expression from monitor configuration
      const timeout = monitorData.payload?.timeout || 60; // Default 60 seconds
      const enableCron = monitorData.payload?.enableCron || false;
      const cronExpression =
        monitorData.payload?.cronExpression || '*/5 * * * *';

      let scheduledTime: Date | null = null;
      let status: 'normal' | 'warning' | 'critical' | 'unknown' = 'unknown';

      if (enableCron && cronExpression) {
        // For cron mode, we assume scheduled time is the latest 5-minute interval
        // This is a simplified implementation, should calculate based on cron expression
        const now = new Date();
        const minutes = now.getMinutes();
        const roundedMinutes = Math.floor(minutes / 5) * 5;
        scheduledTime = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
          now.getHours(),
          roundedMinutes,
          0,
          0
        );

        // If current time hasn't reached next scheduled time, use previous scheduled time
        if (scheduledTime > now) {
          scheduledTime = new Date(scheduledTime.getTime() - 5 * 60 * 1000);
        }
      } else {
        // For non-cron mode, scheduled time is the last push time
        scheduledTime = lastPushTime;
      }

      // Calculate timeout range
      const timeoutStartTime = new Date(
        scheduledTime.getTime() - timeout * 1000
      );
      const timeoutEndTime = new Date(scheduledTime.getTime() + timeout * 1000);

      // Calculate timeline start and end time, ensuring all important time points are included
      const allTimes = [
        lastPushTime,
        scheduledTime,
        timeoutStartTime,
        timeoutEndTime,
        currentTime,
      ];
      const minTime = new Date(Math.min(...allTimes.map((t) => t.getTime())));
      const maxTime = new Date(Math.max(...allTimes.map((t) => t.getTime())));

      // Extend timeline range to ensure sufficient display space
      const timelineStart = new Date(minTime.getTime() - timeout * 500);
      const timelineEnd = new Date(maxTime.getTime() + timeout * 500);

      const timelineStartMs = timelineStart.getTime();
      const timelineEndMs = timelineEnd.getTime();
      const totalTimespan = timelineEndMs - timelineStartMs;

      // Calculate position of each time point on timeline
      const lastPushPosition =
        ((lastPushTime.getTime() - timelineStartMs) / totalTimespan) * 100;
      const currentTimePosition =
        ((currentTime.getTime() - timelineStartMs) / totalTimespan) * 100;
      const scheduledTimePosition =
        ((scheduledTime.getTime() - timelineStartMs) / totalTimespan) * 100;
      const timeoutRangeStart =
        ((timeoutStartTime.getTime() - timelineStartMs) / totalTimespan) * 100;
      const timeoutRangeEnd =
        ((timeoutEndTime.getTime() - timelineStartMs) / totalTimespan) * 100;

      // Check if last push time is within timeout range
      const lastPushInRange =
        lastPushTime.getTime() >= timeoutStartTime.getTime() &&
        lastPushTime.getTime() <= timeoutEndTime.getTime();

      // Calculate status based on whether push time is within range
      if (lastPushInRange) {
        const timeSinceScheduled = Math.abs(
          currentTime.getTime() - scheduledTime.getTime()
        );
        if (timeSinceScheduled < timeout * 800) {
          // 80% of timeout
          status = 'normal';
        } else if (timeSinceScheduled < timeout * 1000) {
          status = 'warning';
        } else {
          status = 'critical';
        }
      } else {
        status = 'critical';
      }

      setTimelineData({
        lastPushTime,
        scheduledTime,
        timeoutEnd: timeoutEndTime,
        status,
        timelineStart,
        timelineEnd,
        lastPushPosition: Math.max(0, Math.min(100, lastPushPosition)),
        currentTimePosition: Math.max(0, Math.min(100, currentTimePosition)),
        timeoutPosition: Math.max(0, Math.min(100, timeoutRangeEnd)),
        scheduledTimePosition: Math.max(
          0,
          Math.min(100, scheduledTimePosition)
        ),
        timeoutRangeStart: Math.max(0, Math.min(100, timeoutRangeStart)),
        timeoutRangeEnd: Math.max(0, Math.min(100, timeoutRangeEnd)),
        timeoutStartTime,
        timeoutEndTime,
      });
    }, [monitorData, lastPushStatusData, currentTime]);

    if (
      !monitorData ||
      monitorData.type !== 'push' ||
      !timelineData.lastPushTime
    ) {
      return null;
    }

    const getStatusColor = () => {
      switch (timelineData.status) {
        case 'normal':
          return '#52c41a'; // green
        case 'warning':
          return '#faad14'; // orange
        case 'critical':
          return '#f5222d'; // red
        default:
          return '#888'; // gray
      }
    };

    // Get timeline background color
    const getTimelineBackground = () => {
      return '#f8f9fa'; // Simple light gray background
    };

    return (
      <Card
        title={
          <div className="flex items-center gap-2">
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: getStatusColor() }}
            />
            <span>{t('Monitor Push Status')}</span>
          </div>
        }
        className="mb-4"
        style={{ borderColor: getStatusColor() }}
      >
        <div className="flex flex-col gap-4">
          {/* Main timeline */}
          <div className="mt-2">
            <div
              className="relative h-8 w-full overflow-hidden rounded-lg"
              style={{
                backgroundColor: getTimelineBackground(),
                border: '1px solid #d9d9d9',
              }}
            >
              {/* Timeout range background */}
              <div
                className="absolute bottom-0 top-0 bg-green-100 opacity-60"
                style={{
                  left: `${timelineData.timeoutRangeStart}%`,
                  width: `${timelineData.timeoutRangeEnd - timelineData.timeoutRangeStart}%`,
                }}
              />

              {/* Timeout range border */}
              <div
                className="absolute bottom-1 top-1 rounded border-2 border-dashed border-green-500"
                style={{
                  left: `${timelineData.timeoutRangeStart}%`,
                  width: `${timelineData.timeoutRangeEnd - timelineData.timeoutRangeStart}%`,
                  backgroundColor: 'rgba(34, 197, 94, 0.1)',
                }}
              />

              {/* Scheduled time marker */}
              {monitorData.payload?.enableCron && (
                <Tooltip
                  title={`${t('Scheduled Time')}: ${dayjs(timelineData.scheduledTime).format('YYYY-MM-DD HH:mm:ss')}`}
                >
                  <div
                    className="absolute bottom-0 top-0 flex items-center justify-center"
                    style={{
                      left: `${timelineData.scheduledTimePosition}%`,
                      transform: 'translateX(-50%)',
                    }}
                  >
                    <div
                      className="h-8 w-1 shadow-md"
                      style={{ backgroundColor: '#722ed1' }}
                    />
                  </div>
                </Tooltip>
              )}

              {/* Last push time marker */}
              <Tooltip
                title={`${t('Last Push Time')}: ${dayjs(timelineData.lastPushTime).format('YYYY-MM-DD HH:mm:ss')}`}
              >
                <div
                  className="absolute bottom-0 top-0 flex items-center justify-center"
                  style={{
                    left: `${timelineData.lastPushPosition}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div className="h-8 w-1 bg-green-500 shadow-md" />
                </div>
              </Tooltip>

              {/* Current time marker */}
              <Tooltip
                title={`${t('Current Time')}: ${dayjs(currentTime).format('YYYY-MM-DD HH:mm:ss')}`}
              >
                <div
                  className="absolute bottom-0 top-0 flex items-center justify-center"
                  style={{
                    left: `${timelineData.currentTimePosition}%`,
                    transform: 'translateX(-50%)',
                  }}
                >
                  <div
                    className="h-8 w-1 shadow-md"
                    style={{ backgroundColor: '#1890ff' }}
                  />
                </div>
              </Tooltip>
            </div>
          </div>

          {/* Legend */}
          <div className="flex justify-center gap-4 text-xs">
            {monitorData.payload?.enableCron && (
              <div className="flex items-center gap-1">
                <div
                  className="h-4 w-1"
                  style={{ backgroundColor: '#722ed1' }}
                />
                <span>{t('Scheduled')}</span>
              </div>
            )}

            <div className="flex items-center gap-1">
              <div className="h-4 w-1 bg-green-500" />
              <span>{t('Last Push')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="h-4 w-1" style={{ backgroundColor: '#1890ff' }} />
              <span>{t('Current')}</span>
            </div>
            <div className="flex items-center gap-1">
              <div
                className="h-3 w-4 rounded border-2 border-dashed border-green-500"
                style={{ backgroundColor: 'rgba(34, 197, 94, 0.1)' }}
              />
              <span>{t('Safe Range')}</span>
            </div>
          </div>

          {/* Status info bar */}
          <div className="flex items-center justify-between rounded bg-gray-50 px-3 py-2 text-sm dark:bg-gray-800">
            <span>
              {t('Timeout Range')}: ±{monitorData.payload?.timeout || 60}
              {t('s')}
            </span>
            <span style={{ color: getStatusColor(), fontWeight: 'bold' }}>
              {timelineData.status === 'normal' && t('Normal')}
              {timelineData.status === 'warning' && t('Warning')}
              {timelineData.status === 'critical' && t('Critical')}
              {timelineData.status === 'unknown' && t('Unknown')}
            </span>
          </div>
        </div>
      </Card>
    );
  }
);

MonitorPushStatus.displayName = 'MonitorPushStatus';
