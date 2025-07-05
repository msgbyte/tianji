import React from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { useServerMap } from './useServerMap';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { PropsOf } from '@/utils/type';

export const ServerPicker: React.FC<PropsOf<typeof Select>> = React.memo((props) => {
  const { t } = useTranslation();
  const serverMap = useServerMap();
  const serverNames = Object.keys(serverMap);

  return (
    <Select {...props}>
      <SelectTrigger>
        <SelectValue placeholder={t('Servers')} />
      </SelectTrigger>
      <SelectContent>
        {serverNames.map((name) => (
          <SelectItem key={name} value={name}>
            {name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
});
ServerPicker.displayName = 'ServerPicker';
