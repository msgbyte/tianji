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
import { SimpleVirtualList } from '@/components/SimpleVirtualList';

export const Route = createFileRoute('/settings/auditLog')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

function PageComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const parentRef = useRef<HTMLDivElement>(null);

  const { data, hasNextPage, fetchNextPage, isFetchingNextPage } =
    trpc.auditLog.fetchByCursor.useInfiniteQuery(
      {
        workspaceId,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

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
      <div className="h-full overflow-hidden p-4">
        <SimpleVirtualList
          allData={allData}
          hasNextPage={hasNextPage}
          isFetchingNextPage={isFetchingNextPage}
          onFetchNextPage={fetchNextPage}
          estimateSize={48}
          renderItem={(item) => {
            return (
              <div className="flex h-full w-full items-center overflow-hidden border-b border-white border-opacity-10 text-sm">
                {item.relatedType && <ColorTag label={item.relatedType} />}
                <div
                  className="mr-2 w-9 text-xs opacity-60"
                  title={dayjs(item.createdAt).format('YYYY-MM-DD HH:mm:ss')}
                >
                  {dayjs(item.createdAt).format('MM-DD HH:mm')}
                </div>
                <div className="h-full flex-1 overflow-auto">
                  {item.content}
                </div>
              </div>
            );
          }}
        />
      </div>
    </CommonWrapper>
  );
}
