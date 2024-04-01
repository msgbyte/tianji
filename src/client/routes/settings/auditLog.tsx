import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Empty, List } from 'antd';
import { useMemo, useRef } from 'react';
import { trpc } from '../../api/trpc';
import { useCurrentWorkspaceId } from '../../store/user';
import { CommonHeader } from '@/components/CommonHeader';
import { last } from 'lodash-es';
import { useVirtualizer } from '@tanstack/react-virtual';
import { useWatch } from '@/hooks/useWatch';
import dayjs from 'dayjs';
import { ColorTag } from '@/components/ColorTag';

export const Route = createFileRoute('/settings/auditLog')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
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
    <CommonWrapper header={<CommonHeader title={t('Audit Log')} />}>
      <ScrollArea className="h-full overflow-hidden p-4">
        <List>
          <div ref={parentRef} className="h-full w-full overflow-auto">
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
      </ScrollArea>
    </CommonWrapper>
  );
}
