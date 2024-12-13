import { useCurrentWorkspaceSafe } from '@/store/user';
import { useTranslation } from '@i18next-toolkit/react';
import React from 'react';
import { Helmet } from 'react-helmet';

export const LayoutHeader: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const currentWorkspace = useCurrentWorkspaceSafe();
  let title = 'Tianji - Insight into everything';
  if (currentWorkspace) {
    title = currentWorkspace.name + ' | ' + title;

    if (currentWorkspace.paused === true) {
      title = t('Paused') + ' | ' + title;
    }
  }

  return (
    <Helmet>
      <title>{title}</title>
    </Helmet>
  );
});
LayoutHeader.displayName = 'LayoutHeader';
