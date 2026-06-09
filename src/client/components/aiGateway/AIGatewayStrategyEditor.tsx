import React, { useMemo, useState } from 'react';
import {
  LuBraces,
  LuPlus,
  LuSearch,
  LuTableProperties,
  LuTrash2,
} from 'react-icons/lu';
import { useTranslation } from '@i18next-toolkit/react';
import { Alert, AlertDescription } from '../ui/alert';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../ui/table';
import { Textarea } from '../ui/textarea';
import { cn } from '../../utils/style';
import {
  buildPricingRowsFromModelCost,
  buildStrategyTextFromPricingRows,
  getAIGatewayStrategyTextError,
  parsePricingRowsFromStrategyText,
} from './AIGatewayStrategyEditor.utils';
import type { AIGatewayPricingRow } from './AIGatewayStrategyEditor.utils';
import { AIGatewayPricingModal } from './AIGatewayPricingModal';

type EditorMode = 'rules' | 'json';

function parseInputNumber(value: string, fallback: number | null = null) {
  if (value === '') {
    return fallback;
  }

  const num = Number(value);
  return Number.isFinite(num) ? num : fallback;
}

function getRowsSafely(value: string | null | undefined) {
  try {
    return parsePricingRowsFromStrategyText(value);
  } catch {
    return [];
  }
}

interface AIGatewayStrategyEditorProps {
  value?: string | null;
  onChange: (value: string) => void;
}

export function AIGatewayStrategyEditor({
  value,
  onChange,
}: AIGatewayStrategyEditorProps) {
  const { t } = useTranslation();
  const [mode, setMode] = useState<EditorMode>('rules');
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const parseError = useMemo(
    () => getAIGatewayStrategyTextError(value),
    [value]
  );
  const rows = useMemo(() => getRowsSafely(value), [value]);

  const writeRows = (nextRows: AIGatewayPricingRow[]) => {
    onChange(buildStrategyTextFromPricingRows(nextRows, value));
  };

  const updateRow = (
    index: number,
    field: keyof AIGatewayPricingRow,
    nextValue: number | null
  ) => {
    writeRows(
      rows.map((row, rowIndex) =>
        rowIndex === index
          ? {
              ...row,
              [field]: nextValue,
            }
          : row
      )
    );
  };

  const addRow = () => {
    const lastRow = rows[rows.length - 1];
    const nextMin =
      lastRow?.inputTokenMax !== null && lastRow?.inputTokenMax !== undefined
        ? lastRow.inputTokenMax + 1
        : 0;

    writeRows([
      ...rows,
      {
        inputTokenMin: nextMin,
        inputTokenMax: null,
        input: null,
        output: null,
        cacheRead: null,
      },
    ]);
  };

  const removeRow = (index: number) => {
    writeRows(rows.filter((_, rowIndex) => rowIndex !== index));
  };

  const applyModelPricing = (
    modelCost: Parameters<typeof buildPricingRowsFromModelCost>[0]
  ) => {
    const nextRows = buildPricingRowsFromModelCost(modelCost);

    if (nextRows.length > 0) {
      writeRows(nextRows);
    }
  };

  return (
    <>
      <div className="border-border bg-muted/20 space-y-3 rounded-md border p-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-sm font-medium">
              <LuTableProperties className="text-muted-foreground h-4 w-4" />
              {t('Pricing Strategy')}
            </div>
            <div className="text-muted-foreground text-xs">
              {t(
                'Prices are USD per 1M tokens. Empty max tokens means no limit.'
              )}
            </div>
          </div>

          <div className="bg-background inline-flex rounded-md border p-1">
            <Button
              type="button"
              size="sm"
              variant={mode === 'rules' ? 'secondary' : 'ghost'}
              Icon={LuTableProperties}
              onClick={() => setMode('rules')}
            >
              {t('Rules')}
            </Button>
            <Button
              type="button"
              size="sm"
              variant={mode === 'json' ? 'secondary' : 'ghost'}
              Icon={LuBraces}
              onClick={() => setMode('json')}
            >
              {t('JSON')}
            </Button>
          </div>
        </div>

        {mode === 'rules' ? (
          <div className="space-y-3">
            {parseError ? (
              <Alert>
                <LuBraces className="h-4 w-4" />
                <AlertDescription>
                  {t(
                    'Strategy JSON is invalid. Switch to JSON mode to fix it.'
                  )}
                </AlertDescription>
              </Alert>
            ) : (
              <Table className="min-w-[720px]">
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-32">
                      {t('Min Tokens')}
                    </TableHead>
                    <TableHead className="min-w-32">
                      {t('Max Tokens')}
                    </TableHead>
                    <TableHead className="min-w-28">
                      {t('Input / 1M')}
                    </TableHead>
                    <TableHead className="min-w-28">
                      {t('Output / 1M')}
                    </TableHead>
                    <TableHead className="min-w-32">
                      {t('Cache Read / 1M')}
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {rows.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={6}
                        className="text-muted-foreground h-16 text-center text-xs"
                      >
                        {t('No pricing rules configured.')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, index) => (
                      <TableRow key={index} className="hover:bg-background">
                        <TableCell>
                          <Input
                            className="w-full min-w-24"
                            type="number"
                            min={0}
                            value={row.inputTokenMin}
                            onChange={(event) =>
                              updateRow(
                                index,
                                'inputTokenMin',
                                parseInputNumber(event.target.value, 0)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="w-full min-w-24"
                            type="number"
                            min={0}
                            placeholder={t('No limit')}
                            value={row.inputTokenMax ?? ''}
                            onChange={(event) =>
                              updateRow(
                                index,
                                'inputTokenMax',
                                parseInputNumber(event.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="w-full min-w-24"
                            type="number"
                            step="0.01"
                            value={row.input ?? ''}
                            onChange={(event) =>
                              updateRow(
                                index,
                                'input',
                                parseInputNumber(event.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="w-full min-w-24"
                            type="number"
                            step="0.01"
                            value={row.output ?? ''}
                            onChange={(event) =>
                              updateRow(
                                index,
                                'output',
                                parseInputNumber(event.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Input
                            className="w-full min-w-24"
                            type="number"
                            step="0.01"
                            value={row.cacheRead ?? ''}
                            onChange={(event) =>
                              updateRow(
                                index,
                                'cacheRead',
                                parseInputNumber(event.target.value)
                              )
                            }
                          />
                        </TableCell>
                        <TableCell>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="ghost"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => removeRow(index)}
                            aria-label={t('Delete pricing rule')}
                          >
                            <LuTrash2 />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            )}

            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="outline"
                Icon={LuPlus}
                onClick={addRow}
                disabled={Boolean(parseError)}
              >
                {t('Add tier')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="outline"
                Icon={LuSearch}
                onClick={() => setIsPricingModalOpen(true)}
                disabled={Boolean(parseError)}
              >
                {t('Find existing pricing')}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                className={cn('text-muted-foreground', {
                  hidden: !value,
                })}
                onClick={() => onChange('')}
              >
                {t('Clear strategy')}
              </Button>
            </div>
          </div>
        ) : (
          <Textarea
            className="min-h-56 font-mono text-xs"
            placeholder={`{
  "price": [
    {
      "inputTokenMin": 0,
      "inputTokenMax": 200000,
      "input": 3,
      "output": 15,
      "cacheRead": 0.3
    }
  ]
}`}
            value={value ?? ''}
            onChange={(event) => onChange(event.target.value)}
          />
        )}
      </div>

      <AIGatewayPricingModal
        isOpen={isPricingModalOpen}
        onClose={() => setIsPricingModalOpen(false)}
        onSelectPricing={(selection) => applyModelPricing(selection.model.cost)}
      />
    </>
  );
}
