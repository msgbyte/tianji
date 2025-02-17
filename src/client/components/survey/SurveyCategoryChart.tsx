import React, { useMemo, useState } from 'react';
import { SimplePieChart } from '../chart/SimplePieChart';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { reverse, sortBy, sumBy, take } from 'lodash-es';
import { ChartConfig } from '../ui/chart';
import { Checkbox } from '../ui/checkbox';
import { useTranslation } from '@i18next-toolkit/react';
import { Dialog, DialogContent, DialogHeader } from '../ui/dialog';
import { SurveyListTable } from './SurveyListTable';

const OTHER_CATEGORY_NAME = 'Other';
const NONE_CATEGORY_NAME = 'Uncategorized';

interface SurveyCategoryChartProps {
  surveyId: string;
}
export const SurveyCategoryChart: React.FC<SurveyCategoryChartProps> =
  React.memo((props) => {
    const workspaceId = useCurrentWorkspaceId();
    const { t } = useTranslation();
    const [hideUncategorized, setHideUncategorized] = useState(true);
    const [selectedCategoryName, setSelectedCategoryName] = useState<
      string | null
    >(null);

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
          name: OTHER_CATEGORY_NAME,
          count: sumBy(ordered, 'count') - sumBy(category, 'count'),
        };
      }

      const chartConfig: ChartConfig = {};
      category.forEach((c, i) => {
        const name = c.name ? c.name : NONE_CATEGORY_NAME;
        chartConfig[`category-${i}`] = {
          label: name,
          color: `hsl(var(--chart-${i + 1}))`,
        };
      });

      return {
        data: category.map((c, i) => ({
          label: c.name ? c.name : NONE_CATEGORY_NAME,
          count: c.count,
          fill: `var(--color-category-${i})`,
        })),
        chartConfig,
      };
    }, [allCategory, hideUncategorized]);

    return (
      <div>
        <SimplePieChart
          className="m-auto max-h-[240px]"
          data={data}
          chartConfig={chartConfig}
          onClick={(data) => {
            const name = data.name;
            if (name === OTHER_CATEGORY_NAME || name === NONE_CATEGORY_NAME) {
              return;
            }
            setSelectedCategoryName(data.name);
          }}
        />
        <div className="flex items-center gap-1">
          <Checkbox
            checked={hideUncategorized}
            onCheckedChange={(checked) =>
              setHideUncategorized(checked === true)
            }
          />
          <span>{t('Hide Uncategorized')}</span>
        </div>

        <Dialog
          open={Boolean(selectedCategoryName)}
          onOpenChange={(open) => {
            if (!open) {
              setSelectedCategoryName(null);
            }
          }}
        >
          <DialogContent className="flex max-h-[90vh] max-w-[90vw] flex-col overflow-hidden">
            <DialogHeader>
              {t('Survey Result')} - {selectedCategoryName}
            </DialogHeader>

            <div className="flex-1 overflow-hidden">
              {typeof selectedCategoryName === 'string' && (
                <SurveyListTable
                  surveyId={props.surveyId}
                  categoryName={selectedCategoryName}
                />
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  });
SurveyCategoryChart.displayName = 'SurveyCategoryChart';
