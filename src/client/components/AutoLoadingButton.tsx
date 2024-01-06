import { Button, ButtonProps } from 'antd';
import React, { useState } from 'react';
import { useEvent } from '../hooks/useEvent';

export const AutoLoadingButton: React.FC<ButtonProps> = React.memo((props) => {
  const [loading, setLoading] = useState(false);

  const handleClick = useEvent(
    async (e: React.MouseEvent<HTMLElement, MouseEvent>) => {
      setLoading(true);
      await props.onClick?.(e);
      setLoading(false);
    }
  );
  return <Button loading={loading} {...props} onClick={handleClick} />;
});
AutoLoadingButton.displayName = 'AutoLoadingButton';
