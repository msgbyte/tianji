import { Id } from 'react-beautiful-dnd';

export type BaseSortableItem = {
  type: 'item';
  id: Id;
};

export type BaseSortableGroup<GroupProps = unknown, ItemProps = unknown> = {
  type: 'group';
  id: Id;
  title?: string;
  items: ((BaseSortableGroup & GroupProps) | (BaseSortableItem & ItemProps))[];
};

export type BaseSortableRoot<GroupProps = unknown> = {
  type: 'root';
  id: Id;
  title?: string;
  items: (BaseSortableItem & GroupProps)[];
};

export type BaseSortableData =
  | BaseSortableRoot
  | BaseSortableGroup
  | BaseSortableItem;

export type SortableData<GroupProps = unknown, ItemProps = unknown> =
  | BaseSortableRoot<GroupProps>
  | (BaseSortableGroup<GroupProps, ItemProps> & GroupProps)
  | (BaseSortableItem & ItemProps);

export type ExtractGroup<T> = T extends { type: 'group' } ? T : never;
export type ExtractItem<T> = T extends { type: 'item' } ? T : never;
