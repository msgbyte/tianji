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
import { compact } from 'lodash-es';
import { toast } from 'sonner';
import { DotPatternBackground } from '@/components/DotPatternBackground';
import { useTheme } from '@/store/settings';

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
  const theme = useTheme();

  const { loginWithPassword, loginWithEmail, loginWithOAuth } = useAuth();

  const [handleLoginWithAccount, isAccountLoading] = useEventWithLoading(
    async (values: any) => {
      const userInfo = await loginWithPassword(
        values.username,
        values.password
      );

      setUserInfo(userInfo);

      navigate({
        to: search.redirect ?? '/',
        replace: true,
      });
    }
  );
  const [handleLoginWithEmail, isEmailLoading] = useEventWithLoading(
    async (values: any) => {
      const url = await loginWithEmail(values.email);

      if (url) {
        window.location.replace(url);
      } else {
        toast.success('Email has been sent');
      }
    }
  );
  const { allowRegister, authProvider } = useGlobalConfig();

  const mainAuthProvider = authProvider.includes('email') ? (
    <Form
      layout="vertical"
      disabled={isEmailLoading}
      onFinish={handleLoginWithEmail}
    >
      <Form.Item label={t('Email')} name="email" rules={[{ required: true }]}>
        <Input type="email" />
      </Form.Item>
      <Form.Item>
        <Button
          size="lg"
          type="submit"
          className="w-full"
          loading={isEmailLoading}
        >
          {t('Login')}
        </Button>
      </Form.Item>
    </Form>
  ) : (
    <Form
      layout="vertical"
      disabled={isAccountLoading}
      onFinish={handleLoginWithAccount}
    >
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
          loading={isAccountLoading}
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
  );

  const extraAuthProviderEl = compact([
    authProvider.includes('github') && (
      <Button
        variant="secondary"
        className="h-12 w-12 p-3"
        onClick={() => loginWithOAuth('github')}
      >
        <LuGithub size={24} />
      </Button>
    ),
    authProvider.includes('custom') && (
      <Button
        variant="secondary"
        className="h-12 w-12 p-3"
        onClick={() => loginWithOAuth('custom')}
      >
        <LuLayers size={24} />
      </Button>
    ),
  ]);

  return (
    <div className="flex h-full w-full items-center justify-center">
      {theme === 'dark' && <DotPatternBackground />}

      <div className="w-80 -translate-y-1/4">
        <div className="text-center">
          <img className="m-auto h-24 w-24" src="/icon.svg" />
        </div>
        <Typography.Title className="text-center" level={2}>
          Tianji
        </Typography.Title>

        {mainAuthProvider}

        {extraAuthProviderEl.length > 0 && (
          <>
            <Divider>{t('Or')}</Divider>

            <div className="flex justify-center gap-2">
              {extraAuthProviderEl}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
