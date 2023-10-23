import { Form, Input } from 'antd';
import React from 'react';
import { MonitorProvider } from './types';

export const MonitorPing: React.FC = React.memo(() => {
  return (
    <>
      <Form.Item
        label="Host"
        name={['payload', 'hostname']}
        rules={[{ required: true }]}
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
