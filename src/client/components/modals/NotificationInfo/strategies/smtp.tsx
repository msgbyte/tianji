import { Checkbox, Form, Input, InputNumber, Select } from 'antd';
import React from 'react';

export const NotificationSMTP: React.FC = React.memo(() => {
  return (
    <>
      <Form.Item
        label="Host"
        name={['payload', 'hostname']}
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Port"
        name={['payload', 'port']}
        rules={[{ required: true }, { type: 'number', min: 0, max: 65535 }]}
      >
        <InputNumber max={65535} min={1} />
      </Form.Item>
      <Form.Item
        label="Security"
        name={['payload', 'security']}
        initialValue={false}
      >
        <Select>
          <Select.Option value={false}>None / STARTTLS (25, 587)</Select.Option>
          <Select.Option value={true}>TLS (465)</Select.Option>
        </Select>
      </Form.Item>
      <Form.Item name={['payload', 'ignoreTLS']} valuePropName="checked">
        <Checkbox>Ignore TLS Error</Checkbox>
      </Form.Item>
      <Form.Item
        label="Username"
        name={['payload', 'username']}
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="Password"
        name={['payload', 'password']}
        rules={[{ required: true }]}
      >
        <Input.Password />
      </Form.Item>
      <Form.Item
        label="From Email"
        name={['payload', 'from']}
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item
        label="To Email"
        name={['payload', 'to']}
        rules={[{ required: true }]}
      >
        <Input />
      </Form.Item>
      <Form.Item label="CC" name={['payload', 'cc']}>
        <Input />
      </Form.Item>
      <Form.Item label="BCC" name={['payload', 'bcc']}>
        <Input />
      </Form.Item>
    </>
  );
});
NotificationSMTP.displayName = 'NotificationSMTP';
