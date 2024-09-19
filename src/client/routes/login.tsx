import { createFileRoute, redirect, useNavigate } from '@tanstack/react-router';
import { useGlobalConfig } from '@/hooks/useConfig';
import { Divider, Form, Typography } from 'antd';
import { useTranslation } from '@i18next-toolkit/react';
import { setUserInfo } from '@/store/user';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/api/authjs/useAuth';
import { useEventWithLoading } from '@/hooks/useEvent';
import { LuGithub, LuLayers } from 'react-icons/lu';

export const Route = createFileRoute('/login')({
  validateSearch: z.object({
    // redirect: z.string().catch('/'),
    redirect: z.string().optional(),
  }),
  beforeLoad: ({ context }) => {
    if (context.userInfo) {
      redirect({
        to: '/website',
      });
    }
  },
  component: LoginComponent,
});

function LoginComponent() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const search = Route.useSearch();

  const { loginWithPassword, loginWithOAuth } = useAuth();

  const [handleLogin, loading] = useEventWithLoading(async (values: any) => {
    const userInfo = await loginWithPassword(values.username, values.password);

    setUserInfo(userInfo);

    navigate({
      to: search.redirect ?? '/',
      replace: true,
    });
  });
  const { allowRegister, authProvider } = useGlobalConfig();

  return (
    <div className="flex h-full w-full items-center justify-center dark:bg-gray-900">
      <div className="w-80 -translate-y-1/4">
        <div className="text-center">
          <img className="m-auto h-24 w-24" src="/icon.svg" />
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
            <Input />
          </Form.Item>
          <Form.Item
            label={t('Password')}
            name="password"
            rules={[{ required: true }]}
          >
            <Input type="password" />
          </Form.Item>
          <Form.Item>
            <Button
              size="lg"
              type="submit"
              className="w-full"
              loading={loading}
            >
              {t('Login')}
            </Button>
          </Form.Item>

          {allowRegister && (
            <Form.Item>
              <Button
                variant="secondary"
                size="lg"
                type="button"
                className="w-full"
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

        {authProvider.length > 0 && (
          <>
            <Divider>{t('Or')}</Divider>

            <div className="flex justify-center gap-2">
              {authProvider.includes('github') && (
                <Button
                  variant="secondary"
                  className="h-12 w-12 p-3"
                  onClick={() => loginWithOAuth('github')}
                >
                  <LuGithub size={24} />
                </Button>
              )}

              {authProvider.includes('custom') && (
                <Button
                  variant="secondary"
                  className="h-12 w-12 p-3"
                  onClick={() => loginWithOAuth('custom')}
                >
                  <LuLayers size={24} />
                </Button>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
