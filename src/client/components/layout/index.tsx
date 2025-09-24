import * as React from 'react';
import { DesktopLayout } from './DesktopLayout';
import { LayoutProps } from './types';
import { useIsMobile } from '@/hooks/useIsMobile';
import { MobileLayout } from './MobileLayout';
import { useRouter } from '@tanstack/react-router';
import { useWatch } from '@/hooks/useWatch';
import { recordEvent } from '@/utils/tracker';

export const Layout: React.FC<LayoutProps> = React.memo((props) => {
  const isMobile = useIsMobile();

  const router = useRouter();
  useWatch([router.basepath], () => {
    recordEvent('route', {
      path: router.latestLocation.pathname,
    });
  });

  if (isMobile) {
    return <MobileLayout {...props} />;
  }

  return <DesktopLayout {...props} />;
});
Layout.displayName = 'Layout';
