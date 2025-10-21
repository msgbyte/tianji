import React from 'react';
import { LuMoon, LuSun } from 'react-icons/lu';
import { useEvent } from '../hooks/useEvent';
import { Button } from 'antd';
import { updateColorScheme, useTheme } from '../store/settings';

interface ColorSchemeSwitcherProps {
  className?: string;
}
export const ColorSchemeSwitcher: React.FC<ColorSchemeSwitcherProps> =
  React.memo(({ className }) => {
    const colorScheme = useTheme();
    const handleSwitchColorScheme = useEvent(() => {
      updateColorScheme(colorScheme === 'dark' ? 'light' : 'dark');
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
        className={className}
      />
    );
  });
ColorSchemeSwitcher.displayName = 'ColorSchemeSwitcher';
