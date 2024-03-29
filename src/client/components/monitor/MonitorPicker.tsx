import { Select, SelectProps } from 'antd';
import React from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { ColorTag } from '../ColorTag';
import { useTranslation } from '@i18next-toolkit/react';

interface MonitorPickerProps extends SelectProps<string> {}
export const MonitorPicker: React.FC<MonitorPickerProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const { data: allMonitor = [] } = trpc.monitor.all.useQuery({
      workspaceId,
    });

    return (
      <Select placeholder={t('Select monitor')} {...props}>
        {allMonitor.map((m) => (
          <Select.Option key={m.id} value={m.id}>
            <ColorTag label={m.type} />
            {m.name}
          </Select.Option>
        ))}
      </Select>
    );
  }
);
MonitorPicker.displayName = 'MonitorPicker';
