import React from 'react';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { LuFilter, LuPlus } from 'react-icons/lu';
import { useTranslation } from '@i18next-toolkit/react';
import { FilterParamsBlock } from './FilterParamsBlock';
import { Button } from '../ui/button';
import { cn } from '@/utils/style';
import type { FilterInfo } from '@tianji/shared';
import type { InsightType } from '@/store/insights';

interface FilterSectionProps {
  /**
   * @default "vertical"
   */
  direction?: 'horizontal' | 'vertical';
  insightId: string;
  insightType: InsightType;
  filters: (FilterInfo | null)[];
  onSetFilter: (index: number, info: FilterInfo) => void;
  onAddFilter: () => void;
  onRemoveFilter: (index: number) => void;
}
export const FilterSection: React.FC<FilterSectionProps> = React.memo(
  (props) => {
    const direction = props.direction ?? 'vertical';
    const workspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation();

    const { data: allFilterParams = [] } = trpc.insights.filterParams.useQuery(
      {
        workspaceId,
        insightId: props.insightId,
        insightType: props.insightType,
      },
      {
        enabled: Boolean(props.insightId),
        trpc: {
          context: {
            skipBatch: true,
          },
        },
      }
    );

    return (
      <div
        className={cn(
          'flex w-full',
          direction === 'horizontal'
            ? 'flex-row items-center gap-2'
            : 'flex-col'
        )}
      >
        {direction === 'horizontal' ? (
          <Button
            className="self-start"
            variant="outline"
            size="icon"
            Icon={LuFilter}
            onClick={props.onAddFilter}
          />
        ) : (
          <div
            className="hover:bg-muted mb-2 flex cursor-pointer items-center justify-between rounded-lg px-2 py-1"
            onClick={() => {
              props.onAddFilter();
            }}
          >
            <div>{t('Filter')}</div>
            <div>
              <LuPlus />
            </div>
          </div>
        )}

        <div className="flex flex-1 flex-row flex-wrap gap-2 overflow-hidden">
          {Array.isArray(props.filters) &&
            props.filters.map((filter, i) => (
              <FilterParamsBlock
                key={i}
                index={i}
                direction={direction}
                list={allFilterParams}
                info={filter}
                onSelect={(info) => props.onSetFilter(i, info)}
                onDelete={() => props.onRemoveFilter(i)}
              />
            ))}
        </div>
      </div>
    );
  }
);
FilterSection.displayName = 'FilterSection';
