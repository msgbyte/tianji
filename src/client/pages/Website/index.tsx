import React from 'react';
import { Route, Routes } from 'react-router';
import { WebsiteList } from '../../components/website/WebsiteList';
import { WebsiteDetail } from './Detail';

export const WebsitePage: React.FC = React.memo(() => {
  return (
    <div className="h-full">
      <Routes>
        <Route path="/" element={<WebsiteList />} />
        <Route path="/:websiteId" element={<WebsiteDetail />} />
      </Routes>
    </div>
  );
});
WebsitePage.displayName = 'WebsitePage';
