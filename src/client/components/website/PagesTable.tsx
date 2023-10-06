import React from 'react';
import { MetricsTable } from './MetricsTable';

interface PagesTableProps {
  websiteId: string;
  startAt: number;
  endAt: number;
}
export const PagesTable: React.FC<PagesTableProps> = React.memo((props) => {
  return <MetricsTable {...props} type="url" title={['pages', 'views']} />;
});
PagesTable.displayName = 'PagesTable';
