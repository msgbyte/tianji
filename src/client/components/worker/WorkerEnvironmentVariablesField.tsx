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

export function WorkerEnvironmentVariablesField() {
  const { t } = useTranslation();
  const form = useFormContext<WorkerEditFormValues>();
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: 'environmentVariables',
    keyName: 'fieldKey',
  });
  const values = useWatch({
    control: form.control,
    name: 'environmentVariables',
  });

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
                    <FormLabel>
                      {t('Environment variable')} {index + 1} {t('key')}
                    </FormLabel>
                    <FormControl>
                      <Input {...keyField} autoComplete="off" />
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
                    <FormLabel>{rowLabel} {t('value')}</FormLabel>
                    <FormControl>
                      <Input
                        {...valueField}
                        value={valueField.value ?? ''}
                        type={
                          currentValue?.type === 'Secret' ? 'password' : 'text'
                        }
                        required={!hasConfiguredSecret}
                        autoComplete="off"
                        onChange={(event) => {
                          if (currentValue?.type === 'Secret') {
                            valueField.onChange(
                              event.target.value === ''
                                ? undefined
                                : event.target.value
                            );
                            return;
                          }

                          valueField.onChange(event);
                        }}
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

        <Button
          type="button"
          variant="outline"
          Icon={LuPlus}
          onClick={() => append({ key: '', type: 'Text', value: '' })}
        >
          {t('Add Environment Variable')}
        </Button>
      </CardContent>
    </Card>
  );
}
