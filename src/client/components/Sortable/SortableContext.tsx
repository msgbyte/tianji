import React from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { useEvent } from '@/hooks/useEvent';
import { reorder } from '@/utils/reorder';
import { SortableItem } from './types';

interface SortableContextProps<T extends SortableItem> {
  list: T[];
  onChange: (list: T[]) => void;
  children: React.ReactNode;
}

export const SortableContext = <T extends SortableItem>(
  props: SortableContextProps<T>
) => {
  const { list, onChange, children } = props;

  const handleDragEnd = useEvent((result: DropResult) => {
    // dropped outside the list
    if (!result.destination) {
      return;
    }

    if (result.type === 'root') {
      const final = reorder(
        list,
        result.source.index,
        result.destination.index
      );
      onChange(final);
      return;
    }

    if (result.type === 'group') {
      // move data from source to destination
      // NOTICE: now only support 1 level

      const final = [...list];
      const sourceGroupIndex = final.findIndex(
        (group) => group.key === result.source.droppableId
      );
      if (sourceGroupIndex === -1) {
        return;
      }
      const destinationGroupIndex = final.findIndex(
        (group) => group.key === result.destination?.droppableId
      );
      if (destinationGroupIndex === -1) {
        return;
      }

      if (sourceGroupIndex === destinationGroupIndex) {
        if (!('children' in final[sourceGroupIndex])) {
          return;
        }

        // same group
        final[sourceGroupIndex].children = reorder(
          final[sourceGroupIndex].children!,
          result.source.index,
          result.destination.index
        );
      } else {
        // cross group
        if (
          !('children' in final[sourceGroupIndex]) ||
          !('children' in final[destinationGroupIndex])
        ) {
          return;
        }

        const sourceGroupItems = Array.from(
          final[sourceGroupIndex].children ?? []
        );
        const [removed] = sourceGroupItems.splice(result.source.index, 1);

        const destinationGroupItems = Array.from(
          final[destinationGroupIndex].children ?? []
        );
        destinationGroupItems.splice(result.destination.index, 0, removed);

        final[sourceGroupIndex].children = sourceGroupItems;
        final[destinationGroupIndex].children = destinationGroupItems;
      }

      onChange(final);
    }
  });

  return (
    <DragDropContext onDragEnd={handleDragEnd}>{children}</DragDropContext>
  );
};
SortableContext.displayName = 'SortableGroup';
