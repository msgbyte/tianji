import { Button, Card, Select, Space, Spin } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useMemo, useState } from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { Loading } from '../Loading';
import { getMonitorLink, getMonitorProvider } from '../modals/monitor/provider';
import { NotFoundTip } from '../NotFoundTip';
import { MonitorInfo as MonitorInfoType } from '../../../types';
import { Area, AreaConfig } from '@ant-design/charts';
import { MonitorHealthBar } from './MonitorHealthBar';
import { useSocketSubscribeList } from '../../api/socketio';
import { last, uniqBy } from 'lodash-es';
import { ErrorTip } from '../ErrorTip';
import { ColorTag } from '../ColorTag';
import { useNavigate } from 'react-router';
import { MonitorStatsBlock } from './MonitorStatsBlock';

interface MonitorInfoProps {
  monitorId: string;
}
export const MonitorInfo: React.FC<MonitorInfoProps> = React.memo((props) => {
  const workspaceId = useCurrentWorkspaceId();
  const { monitorId } = props;
  const [currectResponse, setCurrentResponse] = useState(0);
  const navigate = useNavigate();

  const {
    data: monitorInfo,
    isInitialLoading,
    isLoading,
  } = trpc.monitor.get.useQuery({
    workspaceId,
    monitorId,
  });

  if (isInitialLoading) {
    return <Loading />;
  }

  if (!monitorInfo) {
    return <NotFoundTip />;
  }

  return (
    <Spin spinning={isLoading}>
      <Space className="w-full" direction="vertical">
        <div className="flex justify-between">
          <Space direction="vertical">
            <div className="text-2xl">{monitorInfo.name}</div>

            <div>
              <ColorTag label={monitorInfo.type} />
              <span>
                {getMonitorLink(monitorInfo as any as MonitorInfoType)}
              </span>
            </div>
          </Space>

          <div className="text-black text-opacity-75">
            Monitored for {dayjs().diff(dayjs(monitorInfo.createdAt), 'days')}{' '}
            days
          </div>
        </div>

        <div>
          <Button
            type="primary"
            onClick={() => {
              navigate(`/monitor/${monitorInfo.id}/edit`);
            }}
          >
            Edit
          </Button>
        </div>

        <Card>
          <MonitorHealthBar
            monitorId={monitorId}
            count={40}
            size="large"
            showCurrentStatus={true}
            onBeatsItemUpdate={(items) => {
              setCurrentResponse(last(items)?.value ?? 0);
            }}
          />
        </Card>

        <Card>
          <MonitorDataMetrics
            monitorId={monitorId}
            monitorType={monitorInfo.type}
            currectResponse={currectResponse}
          />
        </Card>

        <Card>
          <MonitorDataChart monitorId={monitorId} />
        </Card>
      </Space>
    </Spin>
  );
});
MonitorInfo.displayName = 'MonitorInfo';

export const MonitorDataMetrics: React.FC<{
  monitorId: string;
  monitorType: string;
  currectResponse: number;
}> = React.memo((props) => {
  const workspaceId = useCurrentWorkspaceId();
  const { monitorId, monitorType, currectResponse } = props;
  const { data, isLoading } = trpc.monitor.dataMetrics.useQuery({
    workspaceId,
    monitorId,
  });
  const providerOverview = useMemo(() => {
    const provider = getMonitorProvider(monitorType);
    if (!provider || !provider.overview) {
      return null;
    }

    return (
      <>
        {provider.overview.map((Component) => (
          <Component monitorId={monitorId} />
        ))}
      </>
    );
  }, [monitorType]);

  if (isLoading) {
    return <Loading />;
  }

  if (!data) {
    return <ErrorTip />;
  }

  return (
    <div className="flex justify-between text-center">
      <MonitorStatsBlock
        title="Response"
        desc="(Current)"
        text={`${currectResponse} ms`}
      />
      <MonitorStatsBlock
        title="Avg. Response"
        desc="(24 hour)"
        text={`${parseFloat(data.recent1DayAvg.toFixed(0))} ms`}
      />
      <MonitorStatsBlock
        title="Uptime"
        desc="(24 hour)"
        text={`${parseFloat(
          (
            (data.recent1DayOnlineCount /
              (data.recent1DayOnlineCount + data.recent1DayOfflineCount)) *
            100
          ).toFixed(2)
        )} %`}
      />
      <MonitorStatsBlock
        title="Uptime"
        desc="(30 days)"
        text={`${parseFloat(
          (
            (data.recent30DayOnlineCount /
              (data.recent30DayOnlineCount + data.recent30DayOfflineCount)) *
            100
          ).toFixed(2)
        )} %`}
      />

      {providerOverview}
    </div>
  );
});
MonitorDataMetrics.displayName = 'MonitorDataMetrics';

const MonitorDataChart: React.FC<{ monitorId: string }> = React.memo(
  (props) => {
    const workspaceId = useCurrentWorkspaceId();
    const { monitorId } = props;
    const [rangeType, setRangeType] = useState('recent');
    const subscribedDataList = useSocketSubscribeList(
      'onMonitorReceiveNewData',
      {
        filter: (data) => {
          return data.monitorId === props.monitorId;
        },
      }
    );

    const range = useMemo((): [Dayjs, Dayjs] => {
      if (rangeType === '3h') {
        return [dayjs().subtract(3, 'hour'), dayjs()];
      }
      if (rangeType === '6h') {
        return [dayjs().subtract(6, 'hour'), dayjs()];
      }
      if (rangeType === '24h') {
        return [dayjs().subtract(24, 'hour'), dayjs()];
      }
      if (rangeType === '1w') {
        return [dayjs().subtract(1, 'week'), dayjs()];
      }

      return [dayjs().subtract(0.5, 'hour'), dayjs()];
    }, [rangeType]);

    const { data: _recentData = [] } = trpc.monitor.recentData.useQuery({
      workspaceId,
      monitorId,
      take: 40,
    });

    const { data: _data = [] } = trpc.monitor.data.useQuery({
      workspaceId,
      monitorId,
      startAt: range[0].valueOf(),
      endAt: range[1].valueOf(),
    });

    const { data, annotations } = useMemo(() => {
      const annotations: AreaConfig['annotations'] = [];
      let start: number | null = null;
      let fetchedData = rangeType === 'recent' ? _recentData : _data;
      const data = uniqBy(
        [...fetchedData, ...subscribedDataList],
        'createdAt'
      ).map((d, i, arr) => {
        const value = d.value > 0 ? d.value : null;
        const time = dayjs(d.createdAt).valueOf();

        if (!value && !start && arr[i - 1]) {
          start = dayjs(arr[i - 1]['createdAt']).valueOf();
        } else if (value && start) {
          annotations.push({
            type: 'region',
            start: [start, 'min'],
            end: [time, 'max'],
            style: {
              fill: 'red',
              fillOpacity: 0.25,
            },
          });
          start = null;
        }

        return {
          value,
          time,
        };
      });

      return { data, annotations };
    }, [_recentData, _data, subscribedDataList]);

    const config = useMemo<AreaConfig>(() => {
      return {
        data,
        height: 200,
        xField: 'time',
        yField: 'value',
        smooth: true,
        meta: {
          time: {
            formatter(value) {
              return dayjs(value).format(
                rangeType === '1w' ? 'MM-DD HH:mm' : 'HH:mm'
              );
            },
          },
        },
        color: 'rgb(34 197 94 / 0.8)',
        areaStyle: () => {
          return {
            fill: 'l(270) 0:rgb(34 197 94 / 0.2) 0.5:rgb(34 197 94 / 0.5) 1:rgb(34 197 94 / 0.8)',
          };
        },
        annotations,
        tooltip: {
          title: (title, datum) => {
            return dayjs(datum.time).format('YYYY-MM-DD HH:mm');
          },
          formatter(datum) {
            return {
              name: 'usage',
              value: datum.value ? datum.value + 'ms' : 'null',
            };
          },
        },
      };
    }, [data, rangeType]);

    return (
      <div>
        <div className="mb-4 text-right">
          <Select
            className="w-20 text-center"
            size="small"
            value={rangeType}
            onChange={(val) => setRangeType(val)}
          >
            <Select.Option value="recent">Recent</Select.Option>
            <Select.Option value="3h">3h</Select.Option>
            <Select.Option value="6h">6h</Select.Option>
            <Select.Option value="24h">24h</Select.Option>
            <Select.Option value="1w">1w</Select.Option>
          </Select>
        </div>

        <Area {...config} />
      </div>
    );
  }
);
MonitorDataChart.displayName = 'MonitorDataChart';
