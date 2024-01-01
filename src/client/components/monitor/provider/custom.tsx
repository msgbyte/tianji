import { Button, Form } from 'antd';
import React from 'react';
import { MonitorProvider } from './types';
import { CodeEditor } from '../../CodeEditor';

export const MonitorCustom: React.FC = React.memo(() => {
  return (
    <>
      <Form.Item
        label="Script JS Code"
        name={['payload', 'code']}
        rules={[{ required: true }]}
      >
        <CodeEditor height={320} />
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
