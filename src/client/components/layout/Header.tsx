import { useCurrentWorkspaceSafe } from '@/store/user';
import React from 'react';
import { Helmet } from 'react-helmet';

export const LayoutHeader: React.FC = React.memo(() => {
  const currentWorkspace = useCurrentWorkspaceSafe();
  let title = 'Tianji - Insight into everything';
  if (currentWorkspace) {
    title = currentWorkspace.name + ' | ' + title;
  }

  return (
    <Helmet>
      <title>{title}</title>
    </Helmet>
  );
});
LayoutHeader.displayName = 'LayoutHeader';
