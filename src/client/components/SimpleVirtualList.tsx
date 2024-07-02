import { useWatch } from '@/hooks/useWatch';
import { VirtualItem, useVirtualizer } from '@tanstack/react-virtual';
import { Empty } from 'antd';
import { last } from 'lodash-es';
import React, { useRef } from 'react';

interface VirtualListProps<T = any> {
  allData: T[];
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  onFetchNextPage: () => void;
  estimateSize: (index: number) => number;
  renderItem: (item: VirtualItem) => React.ReactElement;
}
export const SimpleVirtualList: React.FC<VirtualListProps> = React.memo(
  (props) => {
    const {
      allData,
      hasNextPage,
      isFetchingNextPage,
      onFetchNextPage,
      estimateSize,
      renderItem,
    } = props;

    const parentRef = useRef<HTMLDivElement>(null);

    const rowVirtualizer = useVirtualizer({
      count: hasNextPage ? allData.length + 1 : allData.length,
      getScrollElement: () => parentRef.current,
      estimateSize,
      overscan: 5,
    });

    const virtualItems = rowVirtualizer.getVirtualItems();

    useWatch([virtualItems], () => {
      const lastItem = last(virtualItems);

      if (!lastItem) {
        return;
      }

      if (
        lastItem.index >= allData.length - 1 &&
        hasNextPage &&
        !isFetchingNextPage
      ) {
        onFetchNextPage();
      }
    });

    return (
      <div ref={parentRef} className="h-full w-full overflow-auto">
        {virtualItems.length === 0 && <Empty />}

        <div
          className="relative w-full"
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
          }}
        >
          {virtualItems.map((virtualItem) => renderItem(virtualItem))}
        </div>
      </div>
    );
  }
);
SimpleVirtualList.displayName = 'SimpleVirtualList';
