import { Form, Input } from 'antd';
import React from 'react';
import { MonitorProvider } from './types';
import { hostnameValidator } from '../../../utils/validator';
import { useTranslation } from '@i18next-toolkit/react';

export const MonitorPing: React.FC = React.memo(() => {
  const { t } = useTranslation();

  return (
    <>
      <Form.Item
        label={t('Host')}
        name={['payload', 'hostname']}
        rules={[
          { required: true },
          {
            validator: hostnameValidator,
          },
        ]}
      >
        <Input placeholder="example.com or 1.2.3.4" />
      </Form.Item>
    </>
  );
});
MonitorPing.displayName = 'MonitorPing';

export const pingProvider: MonitorProvider = {
  label: 'Ping',
  name: 'ping',
  link: (info) => String(info.payload.hostname),
  form: MonitorPing,
};
