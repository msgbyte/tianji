import React, { useState } from 'react';
import { SortableData } from '@/components/Sortable/types';
import { SortableGroup } from '@/components/Sortable/SortableGroup';

type MonitorStatusPageServiceItem = SortableData<{}, { title: string }>;

export const MonitorStatusPageServiceList: React.FC = React.memo(() => {
  const [list, setList] = useState<MonitorStatusPageServiceItem[]>([
    {
      type: 'group',
      title: 'Group 1',
      id: 'group1',
      items: [
        {
          id: 'item1',
          type: 'item',
          title: 'Item 1',
        },
        {
          id: 'item2',
          type: 'item',
          title: 'Item 2',
        },
      ],
    },
    {
      type: 'group',
      title: 'Group 2',
      id: 'group2',
      items: [
        {
          id: 'item3',
          type: 'item',
          title: 'Item 3',
        },
        {
          id: 'item4',
          type: 'item',
          title: 'Item 4',
        },
      ],
    },
  ] as MonitorStatusPageServiceItem[]);

  return (
    <SortableGroup
      list={list}
      onChange={(list) => setList(list)}
      renderGroup={(group, children) => (
        <div>
          <div>{group.title}</div>
          <div className="p-2">{children}</div>
        </div>
      )}
      renderItem={(item) => <div>{item.id}</div>}
    />
  );
});
MonitorStatusPageServiceList.displayName = 'MonitorStatusPageServiceList';
