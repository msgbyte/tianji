import { Button, Form, Input, Typography } from 'antd';
import React from 'react';
import { useNavigate } from 'react-router';
import { useRequest } from '../hooks/useRequest';
import { trpc } from '../api/trpc';
import { setJWT } from '../api/auth';
import { setUserInfo } from '../store/user';
import { useTranslation } from '@i18next-toolkit/react';

export const Register: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const mutation = trpc.user.register.useMutation();

  const [{ loading }, handleRegister] = useRequest(async (values: any) => {
    const res = await mutation.mutateAsync({
      username: values.username,
      password: values.password,
    });
    setJWT(res.token);
    setUserInfo(res.info);

    navigate('/dashboard');
  });

  return (
    <div className="w-full h-full flex justify-center items-center">
      <div className="w-80 -translate-y-1/4">
        <div className="text-center">
          <img className="w-24 h-24" src="/icon.svg" />
        </div>
        <Typography.Title className="text-center" level={2}>
          {t('Register Account')}
        </Typography.Title>
        <Form layout="vertical" disabled={loading} onFinish={handleRegister}>
          <Form.Item
            label={t('Username')}
            name="username"
            rules={[{ required: true }]}
          >
            <Input size="large" />
          </Form.Item>
          <Form.Item
            label={t('Password')}
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
              {t('Register')}
            </Button>
          </Form.Item>
        </Form>
      </div>
    </div>
  );
});
Register.displayName = 'Register';
