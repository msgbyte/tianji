import { useWatch } from '@/hooks/useWatch';
import { useTranslation } from '@i18next-toolkit/react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { Empty } from 'antd';
import { last } from 'lodash-es';
import React, { useRef } from 'react';

interface VirtualListProps<T = any> {
  allData: T[];
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  onFetchNextPage: () => void;
  estimateSize: number;
  renderItem: (item: T) => React.ReactElement;
  renderEmpty?: () => React.ReactElement;
}
export const DynamicVirtualList: React.FC<VirtualListProps> = React.memo(
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
        onFetchNextPage();
      }
    });

    return (
      <div
        ref={parentRef}
        className="h-full w-full overflow-y-auto"
        style={{
          contain: 'strict',
        }}
      >
        <div
          className="relative w-full"
          style={{
            height: rowVirtualizer.getTotalSize(),
          }}
        >
          {virtualItems.length === 0 &&
            (renderEmpty ? renderEmpty() : <Empty />)}

          <div
            className="absolute left-0 top-0 w-full"
            style={{
              transform: `translateY(${virtualItems[0]?.start ?? 0}px)`,
            }}
          >
            {virtualItems.map((virtualRow) => {
              const isLoaderRow = virtualRow.index > allData.length - 1;
              const data = allData[virtualRow.index];

              return (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
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
      </div>
    );
  }
);
DynamicVirtualList.displayName = 'DynamicVirtualList';
