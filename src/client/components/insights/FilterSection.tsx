import React from 'react';
import { useInsightsStore } from '@/store/insights';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { LuPlus } from 'react-icons/lu';
import { useTranslation } from '@i18next-toolkit/react';
import { FilterParamsBlock } from './FilterParamsBlock';

export const FilterSection: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId();
  const insightId = useInsightsStore((state) => state.insightId);
  const insightType = useInsightsStore((state) => state.insightType);
  const currentFilters = useInsightsStore((state) => state.currentFilters);
  const setFilter = useInsightsStore((state) => state.setFilter);
  const addFilter = useInsightsStore((state) => state.addFilter);
  const removeFilter = useInsightsStore((state) => state.removeFilter);
  const { t } = useTranslation();

  const { data: allFilterParams = [] } = trpc.insights.filterParams.useQuery(
    {
      workspaceId,
      insightId,
      insightType,
    },
    {
      enabled: Boolean(insightId),
    }
  );

  return (
    <div>
      <div
        className="hover:bg-muted mb-2 flex cursor-pointer items-center justify-between rounded-lg px-2 py-1"
        onClick={() => {
          addFilter();
        }}
      >
        <div>{t('Filter')}</div>
        <div>
          <LuPlus />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {currentFilters.map((filter, i) => (
          <FilterParamsBlock
            key={i}
            index={i}
            list={allFilterParams}
            info={filter}
            onSelect={(info) => setFilter(i, info)}
            onDelete={() => removeFilter(i)}
          />
        ))}
      </div>
    </div>
  );
});
FilterSection.displayName = 'FilterSection';
