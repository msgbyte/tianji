import React, { useEffect, useState } from 'react';

interface DelayRenderProps {
  children: React.ReactNode;
  /**
   * Delay time in milliseconds, default is 500ms
   */
  delay?: number;
}

export const DelayRender: React.FC<DelayRenderProps> = ({
  children,
  delay = 500,
}) => {
  const [shouldRender, setShouldRender] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setShouldRender(true);
    }, delay);

    return () => {
      window.clearTimeout(timer);
    };
  }, [delay]);

  return shouldRender ? <>{children}</> : null;
};
