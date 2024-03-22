import { Card, Empty, List } from 'antd';
import React, { useMemo, useRef } from 'react';
import { useCurrentWorkspaceId } from '../../store/user';
import { PageHeader } from '../../components/PageHeader';
import { trpc } from '../../api/trpc';
import { useVirtualizer } from '@tanstack/react-virtual';
import { last } from 'lodash-es';
import { useWatch } from '../../hooks/useWatch';
import { ColorTag } from '../../components/ColorTag';
import dayjs from 'dayjs';
import { useTranslation } from '@i18next-toolkit/react';

export const AuditLog: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const parentRef = useRef<HTMLDivElement>(null);

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    trpc.auditLog.fetchByCursor.useInfiniteQuery({
      workspaceId,
    });

  const allData = useMemo(() => {
    if (!data) {
      return [];
    }

    return [...data.pages.flatMap((p) => p.items)];
  }, [data]);

  const rowVirtualizer = useVirtualizer({
    count: hasNextPage ? allData.length + 1 : allData.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 48,
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
      fetchNextPage();
    }
  });

  return (
    <div>
      <PageHeader title={t('Audit Log')} />

      <Card>
        <List>
          <div ref={parentRef} className="h-[560px] w-full overflow-auto">
            {virtualItems.length === 0 && <Empty />}

            <div
              className="relative w-full"
              style={{
                height: `${rowVirtualizer.getTotalSize()}px`,
              }}
            >
              {virtualItems.map((virtualRow) => {
                const isLoaderRow = virtualRow.index > allData.length - 1;
                const item = allData[virtualRow.index];

                return (
                  <List.Item
                    key={virtualRow.index}
                    className="absolute left-0 top-0 w-full"
                    style={{
                      height: `${virtualRow.size}px`,
                      transform: `translateY(${virtualRow.start}px)`,
                    }}
                  >
                    {isLoaderRow ? (
                      hasNextPage ? (
                        t('Loading more...')
                      ) : (
                        t('Nothing more to load')
                      )
                    ) : (
                      <div className="flex h-7 items-center overflow-hidden">
                        {item.relatedType && (
                          <ColorTag label={item.relatedType} />
                        )}
                        <div
                          className="mr-2 w-9 text-xs opacity-60"
                          title={dayjs(item.createdAt).format(
                            'YYYY-MM-DD HH:mm:ss'
                          )}
                        >
                          {dayjs(item.createdAt).format('MM-DD HH:mm')}
                        </div>
                        <div className="h-full flex-1 overflow-auto">
                          {item.content}
                        </div>
                      </div>
                    )}
                  </List.Item>
                );
              })}
            </div>
          </div>
        </List>
      </Card>
    </div>
  );
});
AuditLog.displayName = 'AuditLog';
