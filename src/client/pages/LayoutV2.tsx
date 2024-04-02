import * as React from 'react';
import { DesktopLayout } from './Layout/DesktopLayout';
import { LayoutProps } from './Layout/types';
import { useIsMobile } from '@/hooks/useIsMobile';
import { MobileLayout } from './Layout/MobileLayout';

export const LayoutV2: React.FC<LayoutProps> = React.memo((props) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileLayout />;
  }

  return <DesktopLayout {...props} />;
});
LayoutV2.displayName = 'LayoutV2';
