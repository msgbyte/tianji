import React from 'react';
import { useGlobalStateStore } from '../store/global';
import { LuMoon, LuSun } from 'react-icons/lu';
import { useEvent } from '../hooks/useEvent';
import { Button } from 'antd';

export const ColorSchemeSwitcher: React.FC = React.memo(() => {
  const colorScheme = useGlobalStateStore((state) => state.colorScheme);
  const handleSwitchColorScheme = useEvent(() => {
    useGlobalStateStore.setState({
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
