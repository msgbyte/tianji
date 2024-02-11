import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';

export const NoWorkspaceTip: React.FC = React.memo(() => {
  const { t } = useTranslation();

  return <div>{t('Please Select Workspace')}</div>;
});
NoWorkspaceTip.displayName = 'NoWorkspaceTip';
