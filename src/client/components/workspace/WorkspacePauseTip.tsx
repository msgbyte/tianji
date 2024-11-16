import { useWorkspacePaused } from '@/store/user';
import { useTranslation } from '@i18next-toolkit/react';
import React from 'react';

export const WorkspacePauseTip: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const paused = useWorkspacePaused();

  if (!paused) {
    return null;
  }

  return (
    <div className="w-full rounded-b-lg bg-red-500 bg-opacity-60 py-0.5 text-center text-sm">
      {t(
        'Current Workspace has been paused because of exceeding the quota. Please contact the administrator to upgrade your plan.'
      )}
    </div>
  );
});
WorkspacePauseTip.displayName = 'WorkspacePauseTip';
