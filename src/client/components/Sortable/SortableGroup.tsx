import React from 'react';
import { SortableContext } from './SortableContext';
import { StrictModeDroppable } from './StrictModeDroppable';
import { useEvent } from '@/hooks/useEvent';
import { Draggable } from 'react-beautiful-dnd';
import { SortableGroupItem, SortableItem, SortableLeafItem } from './types';

interface SortableGroupProps<GroupProps, ItemProps> {
  list: SortableItem<GroupProps, ItemProps>[];
  onChange: (list: SortableItem<GroupProps, ItemProps>[]) => void;
  renderGroup: (
    group: SortableGroupItem<GroupProps, ItemProps>,
    children: React.ReactNode,
    level: number
  ) => React.ReactNode;
  renderItem: (
    item: SortableLeafItem<ItemProps>,
    index: number,
    group: SortableGroupItem<GroupProps, ItemProps>
  ) => React.ReactNode;
}

export const SortableGroup = <GroupProps, ItemProps>(
  props: SortableGroupProps<GroupProps, ItemProps>
) => {
  const { list, onChange, renderGroup, renderItem } = props;

  const renderItemEl = useEvent(
    (
      item: SortableLeafItem<ItemProps>,
      index: number,
      group: SortableGroupItem<GroupProps, ItemProps>
    ) => {
      return (
        <Draggable key={item.key} draggableId={item.key} index={index}>
          {(dragProvided) => (
            <div
              ref={dragProvided.innerRef}
              {...dragProvided.draggableProps}
              {...dragProvided.dragHandleProps}
            >
              {renderItem(item, index, group)}
            </div>
          )}
        </Draggable>
      );
    }
  );

  const renderGroupEl = useEvent(
    (group: SortableGroupItem<GroupProps, ItemProps>, level = 0) => {
      return (
        <StrictModeDroppable
          droppableId={group.key}
          type={level === 0 ? 'root' : 'group'}
          key={group.key}
        >
          {(dropProvided) => (
            <div ref={dropProvided.innerRef} {...dropProvided.droppableProps}>
              {renderGroup(
                group,
                <>
                  {group.children.map((item, index) =>
                    !('children' in item) ? (
                      renderItemEl(item, index, group)
                    ) : (
                      <Draggable
                        draggableId={item.key}
                        key={item.key}
                        index={index}
                      >
                        {(dragProvided) => (
                          <div
                            ref={dragProvided.innerRef}
                            {...dragProvided.draggableProps}
                            {...dragProvided.dragHandleProps}
                          >
                            {renderGroupEl(item, level + 1)}
                          </div>
                        )}
                      </Draggable>
                    )
                  )}
                </>,
                level
              )}

              {dropProvided.placeholder}
            </div>
          )}
        </StrictModeDroppable>
      );
    }
  );

  return (
    <SortableContext<SortableItem<GroupProps, ItemProps>>
      list={list}
      onChange={onChange}
    >
      {renderGroupEl(
        {
          key: 'root',
          children: list,
        } as SortableGroupItem<GroupProps, ItemProps>,
        0
      )}
    </SortableContext>
  );
};
SortableGroup.displayName = 'SortableGroup';
