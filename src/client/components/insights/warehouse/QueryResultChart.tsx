import React, { useMemo, useState } from 'react';
import {
  TimeEventChart,
  TimeEventChartData,
} from '@/components/chart/TimeEventChart';
import { useTranslation } from '@i18next-toolkit/react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LuChartBar, LuChartLine, LuChartArea } from 'react-icons/lu';

type ChartType = 'line' | 'bar' | 'area';

interface QueryColumn {
  name: string;
  type: string;
}

interface QueryResultChartProps {
  columns: QueryColumn[];
  rows: Record<string, any>[];
}

export const QueryResultChart: React.FC<QueryResultChartProps> = React.memo(
  (props) => {
    const { columns, rows } = props;
    const { t } = useTranslation();
    const [chartType, setChartType] = useState<ChartType>('line');

    // Check if data has a date field
    const hasDateField = useMemo(() => {
      return columns.some((col) => col.name === 'date');
    }, [columns]);

    // Transform data for chart
    const chartData = useMemo(() => {
      if (!hasDateField) {
        return [];
      }

      return rows.map((row) => {
        const item: Record<string, any> = {};
        for (const col of columns) {
          item[col.name] = row[col.name];
        }
        return item;
      });
    }, [rows, columns, hasDateField]);

    // Create chart config
    const chartConfig = useMemo(() => {
      if (!hasDateField) return {};

      const config: Record<string, any> = {};
      columns.forEach((col) => {
        if (col.name !== 'date') {
          config[col.name] = {
            label: col.name,
          };
        }
      });
      return config;
    }, [columns, hasDateField]);

    if (!hasDateField) {
      return (
        <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
          <div className="text-muted-foreground">
            {t(
              'To display a chart, your query must include a "date" field. Please alias a date column as "date" in your SELECT statement.'
            )}
          </div>
          <div className="text-muted-foreground text-sm">
            {t(
              'Example: SELECT created_at AS date, COUNT(*) AS count FROM ...'
            )}
          </div>
        </div>
      );
    }

    if (rows.length === 0) {
      return (
        <div className="text-muted-foreground flex h-full items-center justify-center">
          {t('No data to display')}
        </div>
      );
    }

    return (
      <div className="flex h-full flex-col gap-2 p-4">
        {/* Chart type selector */}
        <div className="flex items-center justify-end gap-2">
          <Select
            value={chartType}
            onValueChange={(value) => setChartType(value as ChartType)}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="line">
                <div className="flex items-center gap-2">
                  <LuChartLine className="h-4 w-4" />
                  <span>{t('Line')}</span>
                </div>
              </SelectItem>
              <SelectItem value="bar">
                <div className="flex items-center gap-2">
                  <LuChartBar className="h-4 w-4" />
                  <span>{t('Bar')}</span>
                </div>
              </SelectItem>
              <SelectItem value="area">
                <div className="flex items-center gap-2">
                  <LuChartArea className="h-4 w-4" />
                  <span>{t('Area')}</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Chart */}
        <div className="flex-1">
          <TimeEventChart
            className="h-full w-full"
            data={chartData as TimeEventChartData[]}
            unit="day"
            chartConfig={chartConfig}
            chartType={chartType}
            drawGradientArea={chartType === 'area'}
          />
        </div>
      </div>
    );
  }
);
QueryResultChart.displayName = 'QueryResultChart';
