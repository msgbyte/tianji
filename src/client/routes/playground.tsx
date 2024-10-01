import { createFileRoute, redirect } from '@tanstack/react-router';
import { isDev } from '@/utils/env';
import {
  MonitorStatusPageServiceItem,
  MonitorStatusPageServiceList,
} from '@/components/monitor/StatusPage/ServiceList';
import { useState } from 'react';
import { EditableText } from '@/components/EditableText';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WebhookPlayground } from '@/components/WebhookPlayground';

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
    <div className="h-full w-full p-4">
      <Tabs defaultValue="current" className="flex h-full flex-col">
        <div>
          <TabsList>
            <TabsTrigger value="current">Current</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="current" className="flex-1 overflow-hidden">
          <WebhookPlayground />
        </TabsContent>
        <TabsContent value="history">
          <div>
            <EditableText
              defaultValue="fooooooooo"
              onSave={() => console.log('save')}
            />

            <MonitorStatusPageServiceList value={list} onChange={setList} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
