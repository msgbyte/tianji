import React from 'react';
import { useInsightsStore } from '@/store/insights';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { LuFilter, LuPlus } from 'react-icons/lu';
import { useTranslation } from '@i18next-toolkit/react';
import { FilterParamsBlock } from './FilterParamsBlock';
import { Button } from '../ui/button';

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
    <div className="flex w-full items-center gap-2">
      <Button
        variant="outline"
        size="icon"
        Icon={LuFilter}
        onClick={addFilter}
      />

      <div className="flex flex-1 flex-row flex-wrap gap-2 overflow-hidden">
        {currentFilters.map((filter, i) => (
          <FilterParamsBlock
            key={i}
            index={i}
            direction="horizontal"
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
