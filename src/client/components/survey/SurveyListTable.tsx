import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import React, { useMemo } from 'react';
import { VirtualizedInfiniteDataTable } from '../VirtualizedInfiniteDataTable';
import { useSurveyListColumns } from './useSurveyListColumns';

interface SurveyListTableProps {
  surveyId: string;
  categoryName?: string;
}
export const SurveyListTable: React.FC<SurveyListTableProps> = React.memo(
  (props) => {
    const workspaceId = useCurrentWorkspaceId();
    const { surveyId, categoryName } = props;

    const {
      data: resultList,
      hasNextPage,
      fetchNextPage,
      isFetching,
      isLoading,
      isInitialLoading,
    } = trpc.survey.resultList.useInfiniteQuery(
      {
        workspaceId,
        surveyId,
        filter: categoryName ? `aiCategory=${categoryName}` : undefined,
      },
      {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
      }
    );

    const { selectedIndex, columns } = useSurveyListColumns(surveyId);

    //flatten the array of arrays from the useInfiniteQuery hook
    const flatData = useMemo(
      () => resultList?.pages?.flatMap((page) => page.items) ?? [],
      [resultList]
    );

    return (
      <VirtualizedInfiniteDataTable
        columns={columns}
        data={flatData}
        onFetchNextPage={fetchNextPage}
        isFetching={isFetching}
        isLoading={isLoading}
        hasNextPage={hasNextPage}
      />
    );
  }
);
SurveyListTable.displayName = 'SurveyListTable';
