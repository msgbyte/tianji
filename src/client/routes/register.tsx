import { Button, Form, Input, Typography } from 'antd';
import { useRequest } from '../hooks/useRequest';
import { trpc } from '../api/trpc';
import { setJWT } from '../api/auth';
import { setUserInfo } from '../store/user';
import { useTranslation } from '@i18next-toolkit/react';
import { createFileRoute, useNavigate } from '@tanstack/react-router';

export const Route = createFileRoute('/register')({
  component: RegisterComponent,
});

function RegisterComponent() {
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

    navigate({
      to: '/',
      replace: true,
    });
  });

  return (
    <div className="flex h-full w-full items-center justify-center dark:bg-gray-900">
      <div className="w-80 -translate-y-1/4">
        <div className="text-center">
          <img className="m-auto h-24 w-24  " src="/icon.svg" />
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
}
