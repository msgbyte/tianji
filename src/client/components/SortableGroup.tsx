import React, { useState } from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { useEvent } from '@/hooks/useEvent';
import { reorder } from '@/utils/reorder';

interface BasicItem {
  type: 'root' | 'group' | 'item';
  items?: BasicItem[];
}

interface SortableGroupProps {
  list: BasicItem[];
  onChange: (list: BasicItem[]) => void;
  children: React.ReactNode;
}

export const SortableGroup: React.FC<SortableGroupProps> = React.memo(
  (props) => {
    const [list, setList] = useState(props.list);

    const handleDragEnd = useEvent((result: DropResult) => {
      // dropped outside the list
      if (!result.destination) {
        return;
      }

      if (result.type === 'root') {
        setList(reorder(list, result.source.index, result.destination.index));
        return;
      }

      if (result.type === 'group') {
        const nestedIndex = list.findIndex((item): boolean => 'items' in item);

        if (nestedIndex === 0) {
          return;
        }

        const nested = list[nestedIndex].items;
        if (!nested) {
          return;
        }

        const children = Array.from(list);
        children[nestedIndex].items = reorder(
          nested,
          result.source.index,
          result.destination.index
        );

        setList([...list]);
      }
    });

    return (
      <DragDropContext onDragEnd={handleDragEnd}>
        {props.children}
      </DragDropContext>
    );
  }
);
SortableGroup.displayName = 'SortableGroup';
