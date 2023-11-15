import { Button, Form, Input, Typography } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router';
import { useRequest } from '../hooks/useRequest';
import { trpc } from '../api/trpc';
import { setJWT } from '../api/auth';
import { setUserInfo } from '../store/user';
import { useGlobalConfig } from '../hooks/useConfig';

export const Login: React.FC = React.memo(() => {
  const navigate = useNavigate();

  const mutation = trpc.user.login.useMutation();
  const [{ loading }, handleLogin] = useRequest(async (values: any) => {
    const res = await mutation.mutateAsync({
      username: values.username,
      password: values.password,
    });

    setJWT(res.token);
    setUserInfo(res.info);
    navigate('/dashboard');
  });
  const { allowRegister } = useGlobalConfig();

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="w-80 -translate-y-1/4">
        <div className="text-center">
          <img className="w-24 h-24" src="/icon.svg" />
        </div>
        <Typography.Title className="text-center" level={2}>
          Tianji
        </Typography.Title>
        <Form layout="vertical" disabled={loading} onFinish={handleLogin}>
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
              Login
            </Button>
          </Form.Item>

          {allowRegister && (
            <Form.Item>
              <Button
                size="large"
                htmlType="button"
                block={true}
                onClick={() => {
                  navigate('/register');
                }}
              >
                Register
              </Button>
            </Form.Item>
          )}
        </Form>
      </div>
    </div>
  );
});
Login.displayName = 'Login';
