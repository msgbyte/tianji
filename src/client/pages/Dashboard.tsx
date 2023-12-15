import React from 'react';
import { Dashboard } from '../components/dashboard/Dashboard';

export const DashboardPage: React.FC = React.memo(() => {
  return <Dashboard />;
});
DashboardPage.displayName = 'DashboardPage';
