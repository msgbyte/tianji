import { createFileRoute, redirect } from '@tanstack/react-router';
import { isDev } from '@/utils/env';
import {
  MonitorStatusPageServiceItem,
  MonitorStatusPageServiceList,
} from '@/components/monitor/StatusPage/ServiceList';
import { useState } from 'react';

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

function PageComponent() {
  const [list, setList] = useState<MonitorStatusPageServiceItem[]>([
    {
      title: 'Group 1',
      key: 'group1',
      children: [
        {
          key: 'item1',
          id: 'fooo',
          type: 'monitor',
        },
      ],
    },
    {
      title: 'Group 2',
      key: 'group2',
      children: [
        {
          key: 'item2',
          id: 'barr',
          type: 'monitor',
        },
      ],
    },
  ]);

  return (
    <div>
      <MonitorStatusPageServiceList value={list} onChange={setList} />
    </div>
  );
}
