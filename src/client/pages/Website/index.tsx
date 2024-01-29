import React from 'react';
import { Route, Routes } from 'react-router';
import { WebsiteList } from '../../components/website/WebsiteList';
import { WebsiteDetail } from './Detail';
import { WebsiteVisitorMapPage } from './Map';

export const WebsitePage: React.FC = React.memo(() => {
  return (
    <div className="h-full">
      <Routes>
        <Route path="/" element={<WebsiteList />} />
        <Route path="/:websiteId" element={<WebsiteDetail />} />
        <Route path="/:websiteId/map" element={<WebsiteVisitorMapPage />} />
      </Routes>
    </div>
  );
});
WebsitePage.displayName = 'WebsitePage';
