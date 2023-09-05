import React from 'react';
import { WebsiteList } from '../components/WebsiteList';

export const Website: React.FC = React.memo(() => {
  return <WebsiteList />;
});
Website.displayName = 'Website';
