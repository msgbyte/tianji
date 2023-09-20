import { Checkbox, Form, Input, InputNumber, Select } from 'antd';
import React from 'react';

export const NotificationSMTP: React.FC = React.memo(() => {
  return (
    <>
      <Form.Item label="Host" name="hostname">
        <Input />
      </Form.Item>
      <Form.Item label="Port" name="port">
        <InputNumber max={65535} min={1} />
      </Form.Item>
      <Form.Item label="Security" name="security">
        <Select>
          <Select.Option value={false}>None / STARTTLS (25, 587)</Select.Option>
          <Select.Option value={true}>TLS (465)</Select.Option>
        </Select>
      </Form.Item>
      <Form name="ignoreTLS">
        <Checkbox>Ignore TLS Error</Checkbox>
      </Form>
      <Form.Item label="Username" name="username">
        <Input />
      </Form.Item>
      <Form.Item label="Password" name="password">
        <Input.Password />
      </Form.Item>
      <Form.Item label="From Email" name="from">
        <Input />
      </Form.Item>
      <Form.Item label="To Email" name="to">
        <Input />
      </Form.Item>
      <Form.Item label="CC" name="cc">
        <Input />
      </Form.Item>
      <Form.Item label="BCC" name="bcc">
        <Input />
      </Form.Item>
    </>
  );
});
NotificationSMTP.displayName = 'NotificationSMTP';
