import React from 'react';
import { useInsightsStore } from '@/store/insights';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { LuPlus } from 'react-icons/lu';
import { useTranslation } from '@i18next-toolkit/react';
import { BreakdownParamsBlock } from './BreakdownParamsBlock';

export const BreakdownSection: React.FC = React.memo(() => {
  const workspaceId = useCurrentWorkspaceId();
  const insightId = useInsightsStore((state) => state.insightId);
  const insightType = useInsightsStore((state) => state.insightType);
  const currentGroups = useInsightsStore((state) => state.currentGroups);
  const setGroups = useInsightsStore((state) => state.setGroups);
  const addGroups = useInsightsStore((state) => state.addGroups);
  const removeGroups = useInsightsStore((state) => state.removeGroups);
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
          addGroups();
        }}
      >
        <div>{t('Breakdown')}</div>
        <div>
          <LuPlus />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        {currentGroups.map((group, i) => (
          <BreakdownParamsBlock
            key={i}
            index={i}
            list={allFilterParams}
            info={group}
            onSelect={(info) => setGroups(i, info)}
            onDelete={() => removeGroups(i)}
          />
        ))}
      </div>
    </div>
  );
});
BreakdownSection.displayName = 'BreakdownSection';
