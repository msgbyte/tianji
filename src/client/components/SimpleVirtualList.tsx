import { useWatch } from '@/hooks/useWatch';
import { useTranslation } from '@i18next-toolkit/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Empty } from 'antd';
import { last } from 'lodash-es';
import React, { useRef } from 'react';

interface VirtualListProps<T = any> {
  allData: T[];
  hasNextPage?: boolean | undefined;
  isFetchingNextPage?: boolean;
  onFetchNextPage?: () => void;
  estimateSize: number;
  renderItem: (item: T) => React.ReactElement;
  renderEmpty?: () => React.ReactElement;
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
      renderEmpty,
    } = props;

    const parentRef = useRef<HTMLDivElement>(null);
    const { t } = useTranslation();
    const rowVirtualizer = useVirtualizer({
      count: hasNextPage ? allData.length + 1 : allData.length,
      getScrollElement: () => parentRef.current,
      estimateSize: () => estimateSize,
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
        onFetchNextPage?.();
      }
    });

    return (
      <div ref={parentRef} className="h-full w-full overflow-auto">
        {virtualItems.length === 0 && (renderEmpty ? renderEmpty() : <Empty />)}

        <div
          className="relative w-full"
          style={{
            height: rowVirtualizer.getTotalSize(),
          }}
        >
          {virtualItems.map((virtualItem) => {
            const isLoaderRow = virtualItem.index > allData.length - 1;
            const data = allData[virtualItem.index];

            return (
              <div
                key={virtualItem.index}
                className="absolute left-0 top-0 w-full"
                style={{
                  height: `${virtualItem.size}px`,
                  transform: `translateY(${virtualItem.start}px)`,
                }}
              >
                {isLoaderRow
                  ? hasNextPage
                    ? t('Loading more...')
                    : t('Nothing more to load')
                  : renderItem(data)}
              </div>
            );
          })}
        </div>
      </div>
    );
  }
);
SimpleVirtualList.displayName = 'SimpleVirtualList';
