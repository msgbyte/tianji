import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  LuTrash2,
  LuChevronDown,
  LuChevronUp,
  LuEyeClosed,
  LuEye,
  LuEyeOff,
} from 'react-icons/lu';
import {
  TimeEventChart,
  TimeEventChartType,
  useTimeEventChartConfig,
} from '../chart/TimeEventChart';
import { DateUnit } from '@tianji/shared';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from '@i18next-toolkit/react';

export interface WarehouseChartBlockProps {
  id: string;
  title: string;
  data: Array<Record<string, any>>;
  unit?: DateUnit;
  chartType?: TimeEventChartType;
  onDelete?: (id: string) => void;
}

export const WarehouseChartBlock: React.FC<WarehouseChartBlockProps> =
  React.memo((props) => {
    const { t } = useTranslation();
    const unit = props.unit ?? 'day';
    const [showTable, setShowTable] = useState(false);

    const keys = useMemo(() => {
      if (!props.data || props.data.length === 0) {
        return [] as string[];
      }

      return Array.from(
        new Set(
          props.data
            .flatMap((row) => Object.keys(row))
            .filter((k) => k !== 'date')
        )
      );
    }, [props.data]);

    const chartData = useMemo(() => {
      if (!props.data || props.data.length === 0) {
        return [] as any[];
      }

      return props.data.map((row) => {
        const date = String(row.date ?? '');
        const item: any = { date };
        keys.forEach((k) => {
          item[k] = Number(row[k] ?? 0);
        });
        return item;
      });
    }, [props.data, keys]);

    const chartConfig = useTimeEventChartConfig(chartData);

    return (
      <Card className="overflow-hidden">
        <CardHeader className="flex h-[48px] flex-row items-center justify-between p-3">
          <CardTitle className="truncate text-sm">{props.title}</CardTitle>
          <Button
            size="icon"
            variant="ghost"
            className="h-7 w-7"
            Icon={LuTrash2}
            onClick={() => props.onDelete?.(props.id)}
          />
        </CardHeader>
        <CardContent className="p-0">
          <div className="h-[280px] p-4">
            <TimeEventChart
              className="h-full w-full"
              data={chartData as any}
              unit={unit}
              chartConfig={chartConfig}
              drawGradientArea={false}
              chartType={props.chartType}
            />
          </div>
          <div className="border-t border-zinc-200 px-3 py-2 dark:border-zinc-800">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">{t('Source Data')}</div>
              <Button
                size="icon"
                variant="ghost"
                Icon={showTable ? LuEye : LuEyeOff}
                onClick={() => setShowTable((v) => !v)}
                aria-label={showTable ? t('Hide') : t('Show')}
              />
            </div>
          </div>
          {showTable && (
            <div className="px-4 pb-4">
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="whitespace-nowrap">
                        {t('Date')}
                      </TableHead>
                      {keys.map((k) => (
                        <TableHead
                          key={k}
                          className="whitespace-nowrap text-right"
                        >
                          {k}
                        </TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {props.data.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="whitespace-nowrap">
                          {String((row as any).date ?? '')}
                        </TableCell>
                        {keys.map((k) => (
                          <TableCell
                            key={k}
                            className="whitespace-nowrap text-right"
                          >
                            {Number((row as any)[k] ?? 0).toLocaleString()}
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  });
WarehouseChartBlock.displayName = 'WarehouseChartBlock';
