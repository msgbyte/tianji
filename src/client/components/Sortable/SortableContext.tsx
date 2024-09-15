import React from 'react';
import { DragDropContext, DropResult } from 'react-beautiful-dnd';
import { useEvent } from '@/hooks/useEvent';
import { reorder } from '@/utils/reorder';
import { BaseSortableData } from './types';

interface SortableContextProps<T extends BaseSortableData = BaseSortableData> {
  list: T[];
  onChange: (list: T[]) => void;
  children: React.ReactNode;
}

export const SortableContext = <T extends BaseSortableData>(
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
        (group) => group.id === result.source.droppableId
      );
      if (sourceGroupIndex === -1) {
        return;
      }
      const destinationGroupIndex = final.findIndex(
        (group) => group.id === result.destination?.droppableId
      );
      if (destinationGroupIndex === -1) {
        return;
      }

      if (sourceGroupIndex === destinationGroupIndex) {
        if (!('items' in final[sourceGroupIndex])) {
          return;
        }

        // same group
        final[sourceGroupIndex].items = reorder(
          final[sourceGroupIndex].items!,
          result.source.index,
          result.destination.index
        );
      } else {
        // cross group
        if (
          !('items' in final[sourceGroupIndex]) ||
          !('items' in final[destinationGroupIndex])
        ) {
          return;
        }

        const sourceGroupItems = Array.from(
          final[sourceGroupIndex].items ?? []
        );
        const [removed] = sourceGroupItems.splice(result.source.index, 1);

        const destinationGroupItems = Array.from(
          final[destinationGroupIndex].items ?? []
        );
        destinationGroupItems.splice(result.destination.index, 0, removed);

        final[sourceGroupIndex].items = sourceGroupItems;
        final[destinationGroupIndex].items = destinationGroupItems;
      }

      onChange(final);
    }
  });

  return (
    <DragDropContext onDragEnd={handleDragEnd}>{children}</DragDropContext>
  );
};
SortableContext.displayName = 'SortableGroup';
