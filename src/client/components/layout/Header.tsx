import { useUserInfo } from '@/store/user';
import React from 'react';
import { Helmet } from 'react-helmet';

export const LayoutHeader: React.FC = React.memo(() => {
  const userInfo = useUserInfo();
  let title = 'Tianji - Insight into everything';
  if (userInfo) {
    title = userInfo.currentWorkspace.name + ' | ' + title;
  }

  return (
    <Helmet>
      <title>{title}</title>
    </Helmet>
  );
});
LayoutHeader.displayName = 'LayoutHeader';
