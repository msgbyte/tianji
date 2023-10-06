import React from 'react';
import { Route, Routes } from 'react-router';
import { WebsiteList } from '../../components/WebsiteList';

export const WebsitePage: React.FC = React.memo(() => {
  return (
    <div className="h-full">
      <Routes>
        <Route path="/" element={<WebsiteList />} />
      </Routes>
    </div>
  );
});
WebsitePage.displayName = 'WebsitePage';
