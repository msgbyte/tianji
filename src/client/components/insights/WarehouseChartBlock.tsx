import React, { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LuTrash2, LuEye, LuEyeOff } from 'react-icons/lu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useTranslation } from '@i18next-toolkit/react';
import {
  InsightsTimeEventChart,
  InsightsTimeEventChartProps,
} from './InsightsTimeEventChart';

export interface WarehouseChartBlockProps extends InsightsTimeEventChartProps {
  id: string;
  title: string;
  onDelete?: (id: string) => void;
}

export const WarehouseChartBlock: React.FC<WarehouseChartBlockProps> =
  React.memo((props) => {
    const { t } = useTranslation();
    const [showTable, setShowTable] = useState(false);
    const data = props.rawData;

    const keys = useMemo(() => {
      if (!data || data.length === 0) {
        return [] as string[];
      }

      return Array.from(
        new Set(
          data.flatMap((row) => Object.keys(row)).filter((k) => k !== 'date')
        )
      );
    }, [data]);

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
            <InsightsTimeEventChart
              className="h-full w-full"
              rawData={props.rawData}
              groups={props.groups}
              metrics={props.metrics}
              time={props.time}
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
                    {data.map((row, idx) => (
                      <TableRow key={idx}>
                        <TableCell className="whitespace-nowrap">
                          {String((row as any).date ?? '')}
                        </TableCell>
                        {keys.map((k) => {
                          const val = (row as any)[k];
                          return (
                            <TableCell
                              key={k}
                              className="whitespace-nowrap text-right"
                            >
                              {typeof val === 'number' ||
                              typeof val === 'bigint'
                                ? Number(val).toLocaleString()
                                : val}
                            </TableCell>
                          );
                        })}
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
