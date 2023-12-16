import React from 'react';
import { useParams } from 'react-router';
import { MonitorStatusPage } from '../../components/monitor/StatusPage';

export const StatusPage: React.FC = React.memo(() => {
  const { slug } = useParams<{ slug: string }>();

  return <MonitorStatusPage slug={slug!} />;
});
StatusPage.displayName = 'StatusPage';
