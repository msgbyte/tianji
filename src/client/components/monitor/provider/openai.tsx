import { Form, Input } from 'antd';
import React from 'react';
import { MonitorOverviewComponent, MonitorProvider } from './types';
import { useCurrentWorkspaceId } from '../../../store/user';
import { trpc } from '../../../api/trpc';
import dayjs from 'dayjs';
import { MonitorStatsBlock } from '../MonitorStatsBlock';
import { useTranslation } from '@i18next-toolkit/react';

export const MonitorOpenai: React.FC = React.memo(() => {
  const { t } = useTranslation();

  return (
    <>
      <Form.Item
        label={t('Session Key')}
        name={['payload', 'sessionKey']}
        rules={[{ required: true }]}
      >
        <Input.Password
          placeholder="sess-************"
          visibilityToggle={false}
        />
      </Form.Item>
    </>
  );
});
MonitorOpenai.displayName = 'MonitorOpenai';

export const MonitorOpenaiOverview: MonitorOverviewComponent = React.memo(
  (props) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const { data } = trpc.monitor.getStatus.useQuery({
      workspaceId,
      monitorId: props.monitorId,
      statusName: 'credit',
    });

    if (!data || !data.payload || typeof data.payload !== 'object') {
      return null;
    }

    const payload = data.payload as Record<string, any>;

    return (
      <MonitorStatsBlock
        title={t('Usage')}
        desc={dayjs(data.updatedAt).format('YYYY-MM-DD')}
        text={`$${payload.totalUsed} / $${payload.allUSD}`}
      />
    );
  }
);
MonitorOpenaiOverview.displayName = 'MonitorOpenaiOverview';

export const openaiProvider: MonitorProvider = {
  label: 'OpenAI',
  name: 'openai',
  form: MonitorOpenai,
  overview: [MonitorOpenaiOverview],
  valueLabel: 'Balance',
  valueFormatter: (value) => `$${value / 100}`,
  minInterval: 300, // min allow request in 5 minute, avoid to pressure for chatgpt
};
