import { Form, Input, InputNumber, Select, Switch, Typography } from 'antd';
import React from 'react';
import { MonitorOverviewComponent, MonitorProvider } from './types';
import { trpc } from '../../../api/trpc';
import { MonitorStatsBlock } from '../MonitorStatsBlock';
import dayjs from 'dayjs';
import { isEmpty } from 'lodash-es';
import { useCurrentWorkspaceId } from '../../../store/user';
import { z } from 'zod';

const MonitorHttp: React.FC = React.memo(() => {
  return (
    <>
      <Form.Item
        label="Url"
        name={['payload', 'url']}
        rules={[
          { required: true },
          {
            validator(rule, value, callback) {
              try {
                z.string().url().parse(value);
                callback();
              } catch (err) {
                callback('Not valid http url');
              }
            },
          },
        ]}
      >
        <Input placeholder="https://example.com" />
      </Form.Item>
      <Form.Item
        label="Method"
        name={['payload', 'method']}
        initialValue={'get'}
      >
        <Select>
          <Select.Option value="get">GET</Select.Option>
          <Select.Option value="post">POST</Select.Option>
          <Select.Option value="put">PUT</Select.Option>
          <Select.Option value="patch">PATCH</Select.Option>
          <Select.Option value="delete">DELETE</Select.Option>
          <Select.Option value="head">HEAD</Select.Option>
          <Select.Option value="options">OPTIONS</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item label="Request Timeout(s)" name={['payload', 'timeout']}>
        <InputNumber defaultValue={30} />
      </Form.Item>
      <Form.Item
        label="Ignore TLS/SSL error"
        valuePropName="checked"
        name={['payload', 'ignoreTLS']}
      >
        <Switch />
      </Form.Item>
      <Form.Item
        label="Content-Type"
        name={['payload', 'contentType']}
        initialValue={'application/json'}
      >
        <Select>
          <Select.Option value="application/json">
            application/json
          </Select.Option>
          <Select.Option value="application/x-www-form-urlencoded">
            application/x-www-form-urlencoded
          </Select.Option>
          <Select.Option value="text/xml; charset=utf-8">
            text/xml
          </Select.Option>
        </Select>
      </Form.Item>
      <Form.Item
        label="Headers"
        name={['payload', 'headers']}
        rules={[
          {
            validator(rule, value, callback) {
              if (!value) {
                callback();
              }

              try {
                const obj = JSON.parse(value);
                if (typeof obj !== 'object') {
                  callback('Not JSON Object');
                } else {
                  callback();
                }
              } catch {
                callback('Not valid JSON string');
              }
            },
          },
        ]}
      >
        <Input.TextArea
          rows={4}
          placeholder='For example:&#13;&#10;{ "key": "value" }'
        />
      </Form.Item>
      <Form.Item
        label="Body"
        name={['payload', 'bodyValue']}
        rules={[
          {
            validator(rule, value, callback) {
              if (!value) {
                callback();
              }

              try {
                const obj = JSON.parse(value);
                if (typeof obj !== 'object') {
                  callback('Not JSON Object');
                } else {
                  callback();
                }
              } catch {
                callback('Not valid JSON string');
              }
            },
          },
        ]}
      >
        <Input.TextArea
          rows={4}
          placeholder='For example:&#13;&#10;{ "key": "value" }'
        />
      </Form.Item>
    </>
  );
});
MonitorHttp.displayName = 'MonitorHttp';

export const MonitorHttpOverview: MonitorOverviewComponent = React.memo(
  (props) => {
    const workspaceId = useCurrentWorkspaceId();
    const { data } = trpc.monitor.getStatus.useQuery({
      workspaceId,
      monitorId: props.monitorId,
      statusName: 'tls',
    });

    if (!data || !data.payload || typeof data.payload !== 'object') {
      return null;
    }

    const payload = data.payload as Record<string, any>;

    if (isEmpty(payload.certInfo)) {
      return null;
    }

    return (
      <MonitorStatsBlock
        title="Cert Exp."
        desc={dayjs(payload.certInfo?.validTo).format('YYYY-MM-DD')}
        text={`${payload.certInfo?.daysRemaining} days`}
      />
    );
  }
);
MonitorHttpOverview.displayName = 'MonitorHttpOverview';

export const httpProvider: MonitorProvider = {
  label: 'HTTP',
  name: 'http',
  link: (info) => (
    <Typography.Link href={String(info.payload.url)} target="_blank">
      {String(info.payload.url)}
    </Typography.Link>
  ),
  form: MonitorHttp,
  overview: [MonitorHttpOverview],
};
