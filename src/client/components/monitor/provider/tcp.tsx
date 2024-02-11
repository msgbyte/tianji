import { Form, Input, InputNumber } from 'antd';
import React from 'react';
import { MonitorProvider } from './types';
import { hostnameValidator, portValidator } from '../../../utils/validator';
import { useTranslation } from '@i18next-toolkit/react';

export const MonitorTCP: React.FC = React.memo(() => {
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
      <Form.Item
        label={t('Port')}
        name={['payload', 'port']}
        rules={[
          { required: true },
          {
            validator: portValidator,
          },
        ]}
      >
        <InputNumber placeholder="80" min={1} max={65535} />
      </Form.Item>
    </>
  );
});
MonitorTCP.displayName = 'MonitorTCP';

export const tcpProvider: MonitorProvider = {
  label: 'TCP Port',
  name: 'tcp',
  link: (info) => `${info.payload.hostname}:${info.payload.port}`,
  form: MonitorTCP,
};
