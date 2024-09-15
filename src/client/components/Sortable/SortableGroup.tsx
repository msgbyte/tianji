import React from 'react';
import { SortableContext } from './SortableContext';
import { StrictModeDroppable } from './StrictModeDroppable';
import { useEvent } from '@/hooks/useEvent';
import { Draggable } from 'react-beautiful-dnd';
import { BaseSortableData, ExtractGroup, ExtractItem } from './types';

interface SortableGroupProps<T extends BaseSortableData> {
  list: T[];
  onChange: (list: T[]) => void;
  renderGroup: (
    group: ExtractGroup<T>,
    children: React.ReactNode
  ) => React.ReactNode;
  renderItem: (item: ExtractItem<T>) => React.ReactNode;
}

export const SortableGroup = <T extends BaseSortableData>(
  props: SortableGroupProps<T>
) => {
  const { list, onChange, renderGroup, renderItem } = props;

  const renderItemEl = useEvent((item: ExtractItem<T>, index: number) => {
    return (
      <Draggable key={item.id} draggableId={item.id} index={index}>
        {(dragProvided) => (
          <div
            ref={dragProvided.innerRef}
            {...dragProvided.draggableProps}
            {...dragProvided.dragHandleProps}
          >
            {renderItem(item)}
          </div>
        )}
      </Draggable>
    );
  });

  const renderGroupEl = useEvent((group: ExtractGroup<T>, level = 0) => {
    return (
      <StrictModeDroppable
        droppableId={group.id}
        type={group.type}
        key={group.id}
      >
        {(dropProvided) => (
          <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
            {renderGroup(
              group,
              <>
                {group.items.map((item, index) =>
                  item.type === 'item' ? (
                    renderItemEl(item as ExtractItem<T>, index)
                  ) : (
                    <Draggable
                      draggableId={item.id}
                      key={item.id}
                      index={index}
                    >
                      {(dragProvided) => (
                        <div
                          ref={dragProvided.innerRef}
                          {...dragProvided.draggableProps}
                          {...dragProvided.dragHandleProps}
                        >
                          {renderGroupEl(item as ExtractGroup<T>, level + 1)}
                        </div>
                      )}
                    </Draggable>
                  )
                )}
              </>
            )}

            {dropProvided.placeholder}
          </div>
        )}
      </StrictModeDroppable>
    );
  });

  return (
    <SortableContext<T> list={list} onChange={onChange}>
      {renderGroupEl(
        {
          id: 'root',
          type: 'root' as const,
          items: list,
        } as any,
        0
      )}
    </SortableContext>
  );
};
SortableGroup.displayName = 'SortableGroup';
