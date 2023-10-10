import { Card, Select, Space, Tag } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import React, { useMemo, useState } from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { Loading } from '../Loading';
import { getMonitorLink } from '../modals/monitor/provider';
import { NotFoundTip } from '../NotFoundTip';
import { MonitorInfo as MonitorInfoType } from '../../../types';
import { Area, AreaConfig } from '@ant-design/charts';
import { MonitorHealthBar } from './MonitorHealthBar';
import { useSocketSubscribeList } from '../../api/socketio';
import { uniqBy } from 'lodash';

interface MonitorInfoProps {
  monitorId: string;
}
export const MonitorInfo: React.FC<MonitorInfoProps> = React.memo((props) => {
  const workspaceId = useCurrentWorkspaceId();
  const { monitorId } = props;

  const { data: monitorInfo, isLoading } = trpc.monitor.get.useQuery({
    workspaceId,
    id: monitorId,
  });

  if (isLoading) {
    return <Loading />;
  }

  if (!monitorInfo) {
    return <NotFoundTip />;
  }

  return (
    <div>
      <Space className="w-full" direction="vertical">
        <div className="flex justify-between">
          <Space direction="vertical">
            <div className="text-2xl">{monitorInfo.name}</div>

            <div>
              <Tag color="cyan">{monitorInfo.type}</Tag>
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

        <Card>
          <MonitorHealthBar
            monitorId={monitorId}
            count={40}
            size="large"
            showCurrentStatus={true}
          />
        </Card>

        <Card>
          <MonitorDataChart monitorId={monitorId} />
        </Card>
      </Space>
    </div>
  );
});
MonitorInfo.displayName = 'MonitorInfo';

const MonitorDataChart: React.FC<{ monitorId: string }> = React.memo(
  (props) => {
    const workspaceId = useCurrentWorkspaceId();
    const { monitorId } = props;
    const [rangeType, setRangeType] = useState('recent');
    const newDataList = useSocketSubscribeList('onMonitorReceiveNewData', {
      filter: (data) => {
        return data.monitorId === props.monitorId;
      },
    });

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

    const { data: _data = [] } = trpc.monitor.data.useQuery({
      workspaceId,
      monitorId,
      startAt: range[0].valueOf(),
      endAt: range[1].valueOf(),
    });

    const { data, annotations } = useMemo(() => {
      const annotations: AreaConfig['annotations'] = [];
      let start: number | null = null;
      const data = uniqBy([..._data, ...newDataList], 'createdAt').map(
        (d, i, arr) => {
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
        }
      );

      return { data, annotations };
    }, [_data, newDataList]);

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
