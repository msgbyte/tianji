import { Select as AntdSelect, SelectProps as AntdSelectProps } from 'antd';
import React from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { ColorTag } from '../ColorTag';
import { useTranslation } from '@i18next-toolkit/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { PropsOf } from '@/utils/type';

interface MonitorPickerOldProps extends AntdSelectProps<string> {}
/**
 * @deprecated please use MonitorPicker
 */
export const MonitorPickerOld: React.FC<MonitorPickerOldProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const { data: allMonitor = [] } = trpc.monitor.all.useQuery({
      workspaceId,
    });

    return (
      <AntdSelect placeholder={t('Select monitor')} {...props}>
        {allMonitor.map((m) => (
          <AntdSelect.Option key={m.id} value={m.id}>
            <ColorTag label={m.type} />
            {m.name}
          </AntdSelect.Option>
        ))}
      </AntdSelect>
    );
  }
);
MonitorPickerOld.displayName = 'MonitorPickerOld';

export const MonitorPicker: React.FC<PropsOf<typeof Select>> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const workspaceId = useCurrentWorkspaceId();
    const { data: allMonitor = [] } = trpc.monitor.all.useQuery({
      workspaceId,
    });

    return (
      <Select {...props}>
        <SelectTrigger>
          <SelectValue placeholder={t('Select monitor')} />
        </SelectTrigger>
        <SelectContent>
          {allMonitor.map((m) => (
            <SelectItem key={m.id} value={m.id}>
              <ColorTag label={m.type} />
              {m.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    );
  }
);
MonitorPicker.displayName = 'MonitorPicker';
