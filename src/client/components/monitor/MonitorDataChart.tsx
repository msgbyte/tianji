import { AreaConfig, Area } from '@ant-design/charts';
import { Select } from 'antd';
import dayjs, { Dayjs } from 'dayjs';
import { uniqBy } from 'lodash-es';
import React, { useState, useMemo } from 'react';
import { useSocketSubscribeList } from '../../api/socketio';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { getMonitorProvider, getProviderDisplay } from './provider';

export const MonitorDataChart: React.FC<{ monitorId: string }> = React.memo(
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

    const { data: monitorInfo } = trpc.monitor.get.useQuery({
      workspaceId,
      monitorId,
    });

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

    const providerInfo = getMonitorProvider(monitorInfo?.type ?? '');

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
            const { name, text } = getProviderDisplay(
              datum.value,
              providerInfo
            );

            return {
              name,
              value: datum.value ? text : 'null',
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
