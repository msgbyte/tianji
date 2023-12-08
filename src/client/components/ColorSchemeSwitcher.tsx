import React from 'react';
import { LuMoon, LuSun } from 'react-icons/lu';
import { useEvent } from '../hooks/useEvent';
import { Button } from 'antd';
import { useSettingsStore } from '../store/settings';

export const ColorSchemeSwitcher: React.FC = React.memo(() => {
  const colorScheme = useSettingsStore((state) => state.colorScheme);
  const handleSwitchColorScheme = useEvent(() => {
    useSettingsStore.setState({
      colorScheme: colorScheme === 'dark' ? 'light' : 'dark',
    });
  });

  return (
    <Button
      icon={
        colorScheme === 'dark' ? (
          <LuMoon className="anticon" />
        ) : (
          <LuSun className="anticon" />
        )
      }
      shape="circle"
      size="large"
      onClick={handleSwitchColorScheme}
    />
  );
});
ColorSchemeSwitcher.displayName = 'ColorSchemeSwitcher';
