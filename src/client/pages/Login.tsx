import { Button, Form, Input, Typography } from 'antd';
import React from 'react';
import { useEvent } from '../hooks/useEvent';
import axios from 'axios';

export const Login: React.FC = React.memo(() => {
  const handleLogin = useEvent(async (values: any) => {
    await axios.post('/api/user/login', {
      username: values.username,
      password: values.password,
    });
  });

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="w-80 -translate-y-1/4">
        <Typography.Title level={2}>Tianji</Typography.Title>
        <Form layout="vertical" onFinish={handleLogin}>
          <Form.Item
            label="Username"
            name="username"
            rules={[{ required: true }]}
          >
            <Input size="large" />
          </Form.Item>
          <Form.Item
            label="Password"
            name="password"
            rules={[{ required: true }]}
          >
            <Input size="large" />
          </Form.Item>
          <Form.Item>
            <Button type="primary" size="large" htmlType="submit" block={true}>
              Login
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
});
Login.displayName = 'Login';
