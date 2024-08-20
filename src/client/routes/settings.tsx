import { CommonHeader } from '@/components/CommonHeader';
import { CommonList } from '@/components/CommonList';
import { CommonWrapper } from '@/components/CommonWrapper';
import { Layout } from '@/components/layout';
import { routeAuthBeforeLoad } from '@/utils/route';
import { useTranslation } from '@i18next-toolkit/react';
import {
  createFileRoute,
  useNavigate,
  useRouterState,
} from '@tanstack/react-router';
import { useEffect } from 'react';

export const Route = createFileRoute('/settings')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const pathname = useRouterState({
    select: (state) => state.location.pathname,
  });

  const items = [
    {
      id: 'profile',
      title: t('Profile'),
      href: '/settings/profile',
    },
    {
      id: 'notifications',
      title: t('Notifications'),
      href: '/settings/notifications',
    },
    {
      id: 'workspace',
      title: t('Workspace'),
      href: '/settings/workspace',
    },
    {
      id: 'auditLog',
      title: t('Audit Log'),
      href: '/settings/auditLog',
    },
    {
      id: 'usage',
      title: t('Usage'),
      href: '/settings/usage',
    },
  ];

  useEffect(() => {
    if (pathname === Route.fullPath) {
      navigate({
        to: '/settings/profile',
      });
    }
  }, []);

  return (
    <Layout
      list={
        <CommonWrapper header={<CommonHeader title={t('Settings')} />}>
          <CommonList items={items} />
        </CommonWrapper>
      }
    />
  );
}
