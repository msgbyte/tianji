import { Form, Input } from 'antd';
import React from 'react';
import { MonitorProvider } from './types';

export const MonitorCustom: React.FC = React.memo(() => {
  return (
    <>
      <Form.Item
        label="Script JS Code"
        name={['payload', 'code']}
        rules={[{ required: true }]}
      >
        <Input.TextArea placeholder="return 1" rows={10} />
      </Form.Item>
    </>
  );
});
MonitorCustom.displayName = 'MonitorCustom';

export const customProvider: MonitorProvider = {
  label: 'Custom',
  name: 'custom',
  form: MonitorCustom,
};
