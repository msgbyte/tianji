import { useCurrentWorkspaceId } from '@/store/user';
import { useTranslation } from '@i18next-toolkit/react';
import { Typography } from 'antd';
import React from 'react';

export const InstallScript: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const command = `curl -o- ${window.location.origin}/serverStatus/${workspaceId}/install.sh?url=${window.location.origin} | bash`;

  return (
    <div>
      <div>{t('Run this command in your linux machine')}</div>

      <Typography.Paragraph
        copyable={{
          format: 'text/plain',
          text: command,
        }}
        className="flex h-[96px] overflow-auto rounded border border-black border-opacity-10 bg-black bg-opacity-5 p-2"
      >
        <span>{command}</span>
      </Typography.Paragraph>

      <div>
        {t(
          'Or you wanna report server status in windows server? switch to Manual tab'
        )}
      </div>
    </div>
  );
});
InstallScript.displayName = 'InstallScript';
