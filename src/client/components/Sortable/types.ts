import { Id } from 'react-beautiful-dnd';

export type SortableItem<GroupProps = unknown, ItemProps = unknown> =
  | SortableLeafItem<ItemProps>
  | SortableGroupItem<GroupProps, ItemProps>;

export type SortableGroupItem<GroupProps = unknown, ItemProps = unknown> = {
  key: Id;
  children: SortableItem<GroupProps, ItemProps>[];
} & GroupProps;

export type SortableLeafItem<ItemProps = unknown> = {
  key: Id;
} & ItemProps;
