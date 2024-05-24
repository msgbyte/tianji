import * as React from 'react';
import { DesktopLayout } from './DesktopLayout';
import { LayoutProps } from './types';
import { useIsMobile } from '@/hooks/useIsMobile';
import { MobileLayout } from './MobileLayout';

export const Layout: React.FC<LayoutProps> = React.memo((props) => {
  const isMobile = useIsMobile();

  if (isMobile) {
    return <MobileLayout {...props} />;
  }

  return <DesktopLayout {...props} />;
});
Layout.displayName = 'Layout';
