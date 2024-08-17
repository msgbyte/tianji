import { isDev } from '@/utils/env';
import React, { PropsWithChildren } from 'react';

export const DevContainer: React.FC<PropsWithChildren> = React.memo((props) => {
  if (isDev) {
    return <>{props.children}</>;
  }

  return null;
});
DevContainer.displayName = 'DevContainer';
