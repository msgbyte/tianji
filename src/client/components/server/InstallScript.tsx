import { useCurrentWorkspaceId } from '@/store/user';
import { useTranslation } from '@i18next-toolkit/react';
import { Typography } from 'antd';
import React, { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

export const InstallScript: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const [commandType, setCommandType] = useState('install');
  const commandMap: Record<string, string> = {
    install: `curl -o- ${window.location.origin}/serverStatus/${workspaceId}/install.sh?url=${window.location.origin} | sudo bash`,
    uninstall: `curl -o- ${window.location.origin}/serverStatus/${workspaceId}/install.sh?url=${window.location.origin} | sudo bash -s -- uninstall`,
    restart: `curl -o- ${window.location.origin}/serverStatus/${workspaceId}/install.sh?url=${window.location.origin} | sudo bash -s -- reset_conf`,
  };
  const command = commandMap[commandType] ?? commandMap['install'];

  return (
    <div>
      <Select value={commandType} onValueChange={setCommandType}>
        <SelectTrigger className="w-[180px]">
          <SelectValue placeholder="Command" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="install">{t('Install')}</SelectItem>
          <SelectItem value="uninstall">{t('Uninstall')}</SelectItem>
          <SelectItem value="restart">{t('Restart')}</SelectItem>
        </SelectContent>
      </Select>

      <div className="px-2 pt-2">
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
    </div>
  );
});
InstallScript.displayName = 'InstallScript';
