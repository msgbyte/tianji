import React, { useMemo } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { ColumnDef } from '@tanstack/react-table';
import {
  DragDropContext,
  Draggable,
  DraggableProvided,
  DraggableRubric,
  DraggableStateSnapshot,
  DropResult,
} from 'react-beautiful-dnd';
import { Button } from './ui/button';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Checkbox } from './ui/checkbox';
import { StrictModeDroppable } from './Sortable/StrictModeDroppable';
import { reorder } from '@/utils/reorder';
import { LuSettings2, LuGripVertical } from 'react-icons/lu';

interface DataTableColumnSelectorProps<TData> {
  columns: ColumnDef<TData>[];
  hiddenColumnIds: string[];
  setHiddenColumnIds: (
    value?: string[] | ((prev?: string[]) => string[])
  ) => void;
  columnOrder?: string[];
  setColumnOrder?: (value?: string[] | ((prev?: string[]) => string[])) => void;
}

function getColumnHeader<TData>(col: ColumnDef<TData>): string {
  if (typeof col.header === 'string') {
    return col.header;
  }
  return col.id || '';
}

export function DataTableColumnSelector<TData>({
  columns,
  hiddenColumnIds,
  setHiddenColumnIds,
  columnOrder,
  setColumnOrder,
}: DataTableColumnSelectorProps<TData>) {
  const { t } = useTranslation();

  const orderedColumns = useMemo(() => {
    if (!columnOrder || columnOrder.length === 0) {
      return columns;
    }
    const orderMap = new Map(columnOrder.map((id, index) => [id, index]));
    return [...columns].sort((a, b) => {
      const aIndex = orderMap.get(a.id!) ?? Number.MAX_SAFE_INTEGER;
      const bIndex = orderMap.get(b.id!) ?? Number.MAX_SAFE_INTEGER;
      return aIndex - bIndex;
    });
  }, [columns, columnOrder]);

  const toggleColumn = (columnId: string) => {
    setHiddenColumnIds((prev = []) => {
      if (prev.includes(columnId)) {
        return prev.filter((id) => id !== columnId);
      } else {
        return [...prev, columnId];
      }
    });
  };

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination || !setColumnOrder) return;

    const currentOrder =
      columnOrder && columnOrder.length > 0
        ? columnOrder
        : columns.map((c) => c.id!);

    const newOrder = reorder(
      currentOrder,
      result.source.index,
      result.destination.index
    );
    setColumnOrder(newOrder);
  };

  const renderDraggableItem = (
    col: ColumnDef<TData>,
    dragProvided: DraggableProvided,
    snapshot: DraggableStateSnapshot
  ) => (
    <div
      ref={dragProvided.innerRef}
      {...dragProvided.draggableProps}
      className={`flex items-center gap-2 rounded-sm px-2 py-1.5 text-sm ${
        snapshot.isDragging
          ? 'bg-white shadow-lg ring-1 ring-zinc-200 dark:bg-zinc-900 dark:ring-zinc-700'
          : 'hover:bg-zinc-100 dark:hover:bg-zinc-800'
      }`}
      style={dragProvided.draggableProps.style}
    >
      {setColumnOrder && (
        <div
          {...dragProvided.dragHandleProps}
          className="cursor-grab text-zinc-400"
        >
          <LuGripVertical className="h-4 w-4" />
        </div>
      )}
      <Checkbox
        checked={!hiddenColumnIds.includes(col.id!)}
        onCheckedChange={() => toggleColumn(col.id!)}
      />
      <span
        className="flex-1 cursor-pointer select-none"
        onClick={() => toggleColumn(col.id!)}
      >
        {getColumnHeader(col)}
      </span>
    </div>
  );

  const renderClone = (
    provided: DraggableProvided,
    snapshot: DraggableStateSnapshot,
    rubric: DraggableRubric
  ) => {
    const col = orderedColumns[rubric.source.index];
    return renderDraggableItem(col, provided, snapshot);
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" Icon={LuSettings2} />
      </PopoverTrigger>
      <PopoverContent align="end" className="w-56 p-0">
        <div className="px-3 py-2 text-sm font-semibold">
          {t('Toggle columns')}
        </div>
        <div className="border-t" />
        <DragDropContext onDragEnd={handleDragEnd}>
          <StrictModeDroppable
            droppableId="column-selector"
            renderClone={renderClone}
          >
            {(provided) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                className="max-h-64 overflow-auto p-1"
              >
                {orderedColumns.map((col, index) => (
                  <Draggable
                    key={col.id}
                    draggableId={col.id!}
                    index={index}
                    isDragDisabled={!setColumnOrder}
                  >
                    {(dragProvided, snapshot) =>
                      renderDraggableItem(col, dragProvided, snapshot)
                    }
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </StrictModeDroppable>
        </DragDropContext>
      </PopoverContent>
    </Popover>
  );
}
