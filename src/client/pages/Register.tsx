import { Button, Form, Input, Typography } from 'antd';
import React from 'react';
import { model } from '../api/model';
import { useNavigate } from 'react-router';
import { useRequest } from '../hooks/useRequest';

export const Register: React.FC = React.memo(() => {
  const navigate = useNavigate();

  const [{ loading }, handleRegister] = useRequest(async (values: any) => {
    await model.user.register(values.username, values.password);
    navigate('/dashboard');
  });

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="w-80 -translate-y-1/4">
        <Typography.Title level={2}>Register Account</Typography.Title>
        <Form layout="vertical" disabled={loading} onFinish={handleRegister}>
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
            <Input.Password size="large" />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              size="large"
              htmlType="submit"
              block={true}
              loading={loading}
            >
              Register
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
});
Register.displayName = 'Register';
