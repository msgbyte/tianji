import React, { useMemo, useState } from 'react';
import { SimplePieChart } from '../chart/SimplePieChart';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { reverse, sortBy, sumBy, take } from 'lodash-es';
import { ChartConfig } from '../ui/chart';
import { Checkbox } from '../ui/checkbox';
import { useTranslation } from '@i18next-toolkit/react';

interface SurveyCategoryChartProps {
  surveyId: string;
}
export const SurveyCategoryChart: React.FC<SurveyCategoryChartProps> =
  React.memo((props) => {
    const workspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation();
    const [hideUncategorized, setHideUncategorized] = useState(false);

    const { data: allCategory = [] } = trpc.survey.aiCategoryList.useQuery({
      workspaceId,
      surveyId: props.surveyId,
    });

    const { data, chartConfig } = useMemo(() => {
      const ordered = reverse(
        sortBy(
          hideUncategorized
            ? allCategory.filter((item) => item.name)
            : allCategory,
          (d) => d.count
        )
      );
      const category = take(ordered, 4);

      if (ordered.length >= 5) {
        category[4] = {
          name: 'Other',
          count: sumBy(ordered, 'count') - sumBy(category, 'count'),
        };
      }

      const chartConfig: ChartConfig = {};
      category.forEach((c, i) => {
        const name = c.name ? c.name : 'Uncategorized';
        chartConfig[`category-${i}`] = {
          label: name,
          color: `hsl(var(--chart-${i + 1}))`,
        };
      });

      return {
        data: category.map((c, i) => ({
          label: c.name ? c.name : 'Uncategorized',
          count: c.count,
          fill: `var(--color-category-${i})`,
        })),
        chartConfig,
      };
    }, [allCategory, hideUncategorized]);

    return (
      <div>
        <SimplePieChart data={data} chartConfig={chartConfig} />
        <div className="flex items-center gap-1">
          <Checkbox
            checked={hideUncategorized}
            onCheckedChange={(checked) =>
              setHideUncategorized(checked === true)
            }
          />
          <span>{t('Hide Uncategorized')}</span>
        </div>
      </div>
    );
  });
SurveyCategoryChart.displayName = 'SurveyCategoryChart';
