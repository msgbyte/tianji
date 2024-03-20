import {
  createFileRoute,
  getRouteApi,
  useNavigate,
} from '@tanstack/react-router';
import { useRequest } from '@/hooks/useRequest';
import { setJWT } from '@/api/auth';
import { useGlobalConfig } from '@/hooks/useConfig';
import { trpc } from '@/api/trpc';
import { Button, Form, Input, Typography } from 'antd';
import { useTranslation } from '@i18next-toolkit/react';
import { setUserInfo } from '@/store/user';
import { z } from 'zod';

export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    // redirect: z.string().catch('/'),
    redirect: z.string().optional(),
  }),
  component: LoginComponent,
});

const routeApi = getRouteApi('/login');

function LoginComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const loginMutation = trpc.user.login.useMutation();
  const search = routeApi.useSearch();

  const [{ loading }, handleLogin] = useRequest(async (values: any) => {
    const res = await loginMutation.mutateAsync({
      username: values.username,
      password: values.password,
    });

    setJWT(res.token);
    setUserInfo(res.info);
    navigate({
      to: search.redirect ?? '/dashboard',
    });
  });
  const { allowRegister } = useGlobalConfig();

  return (
    <div className="w-full h-full flex justify-center items-center dark:bg-gray-900">
      <div className="w-80 -translate-y-1/4">
        <div className="text-center">
          <img className="w-24 h-24" src="/icon.svg" />
        </div>
        <Typography.Title className="text-center" level={2}>
          Tianji
        </Typography.Title>
        <Form layout="vertical" disabled={loading} onFinish={handleLogin}>
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
              {t('Login')}
            </Button>
          </Form.Item>

          {allowRegister && (
            <Form.Item>
              <Button
                size="large"
                htmlType="button"
                block={true}
                onClick={() => {
                  navigate({
                    to: '/register',
                  });
                }}
              >
                {t('Register')}
              </Button>
            </Form.Item>
          )}
        </Form>
      </div>
    </div>
  );
}
