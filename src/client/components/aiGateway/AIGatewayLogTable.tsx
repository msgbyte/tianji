import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import React, { useMemo, useState } from 'react';
import { VirtualizedInfiniteDataTable } from '../VirtualizedInfiniteDataTable';
import { useAIGatewayLogColumns } from './useAIGatewayLogColumns';
import {
  Sheet,
  SheetContent,
  SheetDataSection,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '../ui/sheet';
import { useTranslation } from '@i18next-toolkit/react';
import { ScrollArea } from '../ui/scroll-area';
import { Button } from '../ui/button';
import dayjs from 'dayjs';
import { Empty } from 'antd';
import { useEvent } from '@/hooks/useEvent';
import { Card, CardContent } from '../ui/card';
import { AIGatewayStatus } from './AIGatewayStatus';

interface AIGatewayLogTableProps {
  gatewayId: string;
}
export const AIGatewayLogTable: React.FC<AIGatewayLogTableProps> = React.memo(
  (props) => {
    const { gatewayId } = props;
    const workspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation();

    const {
      data: resultList,
      hasNextPage,
      fetchNextPage,
      isFetching,
      isLoading,
    } = trpc.aiGateway.logs.useInfiniteQuery(
      {
        workspaceId,
        gatewayId,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

    const [selectedIndex, setSelectedIndex] = useState(-1);

    const handleRowSelect = useEvent((index: number) => {
      setSelectedIndex(selectedIndex === index ? -1 : index);
    });

    const { columns } = useAIGatewayLogColumns(handleRowSelect);

    // Flatten data for table display
    const flatData = useMemo(
      () => resultList?.pages?.flatMap((page) => page.items) ?? [],
      [resultList]
    );

    const selectedItem = selectedIndex >= 0 ? flatData[selectedIndex] : null;

    const renderJsonData = (data: any) => {
      try {
        return (
          <Card>
            <CardContent className="p-2">
              <pre className="max-h-80 overflow-auto whitespace-pre-wrap text-xs">
                {JSON.stringify(data, null, 2)}
              </pre>
            </CardContent>
          </Card>
        );
      } catch (err) {
        return <div className="text-red-500">{String(err)}</div>;
      }
    };

    return (
      <div className="flex flex-1 flex-col">
        <VirtualizedInfiniteDataTable
          columns={columns}
          data={flatData}
          onFetchNextPage={fetchNextPage}
          isFetching={isFetching}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
        />

        <Sheet
          open={Boolean(selectedItem)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedIndex(-1);
            }
          }}
        >
          <SheetContent className="flex flex-col">
            <SheetHeader>
              <SheetTitle>
                {t('Detail')} {selectedIndex >= 0 && `#${selectedIndex + 1}`}
              </SheetTitle>
            </SheetHeader>

            <ScrollArea className="flex-1 py-4">
              {selectedItem ? (
                <div>
                  <SheetDataSection label="ID">
                    {selectedItem.id}
                  </SheetDataSection>
                  <SheetDataSection label={t('Statue')}>
                    <AIGatewayStatus status={selectedItem.status} />
                  </SheetDataSection>

                  <SheetDataSection label={t('Model')}>
                    {selectedItem.modelName ?? (
                      <span className="opacity-40">(null)</span>
                    )}
                  </SheetDataSection>

                  <SheetDataSection label={t('Created At')}>
                    {dayjs(selectedItem.createdAt).format(
                      'YYYY-MM-DD HH:mm:ss'
                    )}
                  </SheetDataSection>

                  <SheetDataSection label={t('Price')}>
                    <span className="mr-1 opacity-60">$</span>
                    {selectedItem.price}
                  </SheetDataSection>

                  <SheetDataSection label={t('Duration')}>
                    {selectedItem.duration} ms
                  </SheetDataSection>

                  <SheetDataSection label="TTFT">
                    {selectedItem.ttft} ms
                  </SheetDataSection>

                  <SheetDataSection label="Tokens">
                    {selectedItem.inputToken}↑ | {selectedItem.outputToken}↓
                  </SheetDataSection>

                  <SheetDataSection label={t('Request Payload')}>
                    {renderJsonData(selectedItem.requestPayload)}
                  </SheetDataSection>

                  <SheetDataSection label={t('Response Payload')}>
                    {renderJsonData(selectedItem.responsePayload)}
                  </SheetDataSection>
                </div>
              ) : (
                <Empty />
              )}
            </ScrollArea>

            <SheetFooter>
              <Button
                variant="outline"
                disabled={selectedIndex === 0}
                onClick={() => {
                  setSelectedIndex((prev) => prev - 1);
                }}
              >
                {t('Prev')}
              </Button>
              <Button
                disabled={selectedIndex === flatData.length - 1 && !hasNextPage}
                loading={isFetching || isLoading}
                onClick={() => {
                  if (selectedIndex < flatData.length - 1) {
                    setSelectedIndex((prev) => prev + 1);
                  } else {
                    // fetch next page
                    fetchNextPage().then(() => {
                      setSelectedIndex((prev) => prev + 1);
                    });
                  }
                }}
              >
                {t('Next')}
              </Button>
            </SheetFooter>
          </SheetContent>
        </Sheet>
      </div>
    );
  }
);
AIGatewayLogTable.displayName = 'AIGatewayLogTable';
