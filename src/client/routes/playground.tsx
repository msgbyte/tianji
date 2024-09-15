import { createFileRoute, redirect } from '@tanstack/react-router';
import { isDev } from '@/utils/env';
import { MonitorStatusPageServiceList } from '@/components/monitor/StatusPage/ServiceList';

export const Route = createFileRoute('/playground')({
  beforeLoad: () => {
    if (!isDev) {
      throw redirect({
        to: '/',
      });
    }
  },
  component: PageComponent,
});

function PageComponent(this: {
  beforeLoad: () => void;
  component: () => import('react/jsx-runtime').JSX.Element;
}) {
  return (
    <div>
      <MonitorStatusPageServiceList />
    </div>
  );
}
