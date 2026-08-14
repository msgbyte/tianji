import { useState } from 'react';
import { useTranslation } from '@i18next-toolkit/react';
import { useFieldArray, useFormContext, useWatch } from 'react-hook-form';
import { LuPlus, LuTrash2 } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { WorkerEditFormValues } from './WorkerEditForm';

type WorkerEnvironmentVariableFormValueBase = {
  id?: string;
  key: string;
};

export type WorkerEnvironmentVariableFormValue =
  | (WorkerEnvironmentVariableFormValueBase & {
      type: 'Text';
      value: string;
    })
  | (WorkerEnvironmentVariableFormValueBase & {
      type: 'Secret';
      value?: string;
      hasValue?: boolean;
    });

const environmentVariableKeyPattern = /^[A-Za-z_][A-Za-z0-9_]*$/;

export function parseWorkerEnvironmentVariablesText(text: string) {
  const parsed = new Map<string, string>();

  text.split(/\r?\n/).forEach((sourceLine, index) => {
    const line = sourceLine.trim();
    if (!line || line.startsWith('#')) {
      return;
    }

    const separatorIndex = line.indexOf('=');
    const key = line.slice(0, separatorIndex).trim();
    if (separatorIndex < 1 || !environmentVariableKeyPattern.test(key)) {
      throw new Error(`Invalid environment variable at line ${index + 1}`);
    }

    parsed.set(key, line.slice(separatorIndex + 1).trim());
  });

  if (parsed.size === 0) {
    throw new Error('No environment variables to import');
  }

  return [...parsed].map(([key, value]) => ({ key, value }));
}

export function WorkerEnvironmentVariablesField() {
  const { t } = useTranslation();
  const form = useFormContext<WorkerEditFormValues>();
  const { fields, append, remove, replace } = useFieldArray({
    control: form.control,
    name: 'environmentVariables',
    keyName: 'fieldKey',
  });
  const values = useWatch({
    control: form.control,
    name: 'environmentVariables',
  });
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [importText, setImportText] = useState('');
  const [importError, setImportError] = useState<string>();

  const handleImport = () => {
    try {
      const imported = parseWorkerEnvironmentVariablesText(importText);
      const importedByKey = new Map(
        imported.map(({ key, value }) => [key, value])
      );
      const nextValues = form
        .getValues('environmentVariables')
        .map((variable): WorkerEnvironmentVariableFormValue => {
          const importedValue = importedByKey.get(variable.key);
          if (importedValue === undefined && !importedByKey.has(variable.key)) {
            return variable;
          }

          importedByKey.delete(variable.key);
          return {
            id: variable.id,
            key: variable.key,
            type: 'Text',
            value: importedValue as string,
          };
        });

      importedByKey.forEach((value, key) => {
        nextValues.push({ key, type: 'Text', value });
      });

      replace(nextValues);
      setImportText('');
      setImportError(undefined);
      setIsImportOpen(false);
    } catch (error) {
      setImportError(error instanceof Error ? error.message : String(error));
    }
  };

  const handleImportOpenChange = (open: boolean) => {
    setIsImportOpen(open);
    if (!open) {
      setImportError(undefined);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('Environment Variables')}</CardTitle>
        <CardDescription>
          {t('Configure text and secret values available to this worker.')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {fields.map((field, index) => {
          const currentValue = values?.[index];
          const rowLabel =
            currentValue?.key || `${t('Environment variable')} ${index + 1}`;
          const rowName = `environmentVariables.${index}` as const;
          const valueName = `${rowName}.value` as const;
          const hasConfiguredSecret =
            currentValue?.type === 'Secret' && currentValue.hasValue === true;

          return (
            <div
              key={field.fieldKey}
              className="grid gap-4 rounded-lg border p-4 md:grid-cols-[minmax(0,1fr)_10rem_minmax(0,1fr)_auto]"
            >
              <FormField
                control={form.control}
                name={`environmentVariables.${index}.key`}
                render={({ field: keyField }) => (
                  <FormItem>
                    <FormLabel>{t('Key')}</FormLabel>
                    <FormControl>
                      <Input
                        {...keyField}
                        aria-label={`${t('Environment variable')} ${index + 1} ${t('key')}`}
                        autoComplete="off"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={`environmentVariables.${index}.type`}
                render={({ field: typeField }) => (
                  <FormItem>
                    <FormLabel>{t('Type')}</FormLabel>
                    <Select
                      value={typeField.value}
                      onValueChange={(nextType: 'Text' | 'Secret') => {
                        if (nextType === typeField.value) {
                          return;
                        }

                        const currentRow = form.getValues(rowName);
                        const nextRow: WorkerEnvironmentVariableFormValue =
                          nextType === 'Text'
                            ? {
                                id: currentRow.id,
                                key: currentRow.key,
                                type: 'Text',
                                value: '',
                              }
                            : {
                                id: currentRow.id,
                                key: currentRow.key,
                                type: 'Secret',
                                value: '',
                              };
                        form.setValue(
                          rowName,
                          nextRow,
                          { shouldDirty: true, shouldValidate: true }
                        );
                      }}
                    >
                      <FormControl>
                        <SelectTrigger
                          aria-label={`${t('Environment variable')} ${index + 1} ${t('type')}`}
                        >
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Text">{t('Text')}</SelectItem>
                        <SelectItem value="Secret">{t('Secret')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name={valueName}
                render={({ field: valueField }) => (
                  <FormItem>
                    <FormLabel>{t('Value')}</FormLabel>
                    <FormControl>
                      <Input
                        {...valueField}
                        aria-label={`${rowLabel} ${t('value')}`}
                        value={valueField.value ?? ''}
                        type={
                          currentValue?.type === 'Secret' ? 'password' : 'text'
                        }
                        autoComplete="off"
                        onChange={valueField.onChange}
                      />
                    </FormControl>
                    {hasConfiguredSecret && (
                      <FormDescription>
                        {t('A secret value is configured')}
                      </FormDescription>
                    )}
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-end">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  Icon={LuTrash2}
                  aria-label={`${t('Remove environment variable')} ${index + 1}`}
                  onClick={() => remove(index)}
                />
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            Icon={LuPlus}
            onClick={() => append({ key: '', type: 'Text', value: '' })}
          >
            {t('Add Environment Variable')}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => setIsImportOpen(true)}
          >
            {t('Import Text')}
          </Button>
        </div>

        <Dialog open={isImportOpen} onOpenChange={handleImportOpenChange}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('Import Environment Variables')}</DialogTitle>
              <DialogDescription>
                {t(
                  'Enter one KEY=VALUE pair per line. Existing keys will be overwritten as Text values.'
                )}
              </DialogDescription>
            </DialogHeader>
            <Textarea
              aria-label={t('Environment variables text')}
              className="min-h-56 font-mono"
              placeholder={'API_URL=https://example.com\nTOKEN=example-token'}
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
            />
            {importError && (
              <p className="text-destructive text-sm">{importError}</p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => handleImportOpenChange(false)}
              >
                {t('Cancel')}
              </Button>
              <Button type="button" onClick={handleImport}>
                {t('Import')}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
