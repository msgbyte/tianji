import React from 'react';
import { MonitorPicker } from '../MonitorPicker';
import { useTranslation } from '@i18next-toolkit/react';
import { Button } from '@/components/ui/button';
import { LuMinusCircle, LuPlus } from 'react-icons/lu';
import { MarkdownEditor } from '@/components/MarkdownEditor';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEventWithLoading } from '@/hooks/useEvent';
import { Input as AntdInput, Typography } from 'antd';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Controller, useFieldArray, useForm } from 'react-hook-form';
import { domainRegex, slugRegex } from '@tianji/shared';
import { useElementSize } from '@/hooks/useResizeObserver';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';

const Text = Typography.Text;

const editFormSchema = z.object({
  title: z.string(),
  slug: z.string().regex(slugRegex),
  description: z.string(),
  domain: z
    .string()
    .regex(domainRegex, 'Invalid domain')
    .or(z.literal(''))
    .optional(),
  monitorList: z.array(
    z.object({
      id: z.string(),
      showCurrent: z.boolean().default(false).optional(),
    })
  ),
});

export type MonitorStatusPageEditFormValues = z.infer<typeof editFormSchema>;

interface MonitorStatusPageEditFormProps {
  isLoading?: boolean;
  initialValues?: Partial<MonitorStatusPageEditFormValues>;
  onFinish: (values: MonitorStatusPageEditFormValues) => Promise<void>;
  onCancel?: () => void;
  saveButtonLabel?: string;
}

export const MonitorStatusPageEditForm: React.FC<MonitorStatusPageEditFormProps> =
  React.memo((props) => {
    const { t } = useTranslation();
    const { ref, width } = useElementSize();

    const form = useForm<MonitorStatusPageEditFormValues>({
      resolver: zodResolver(editFormSchema),
      defaultValues: props.initialValues ?? {
        title: '',
        slug: '',
        description: '',
        domain: '',
        monitorList: [],
      },
    });

    const { fields, append, remove } = useFieldArray({
      control: form.control,
      name: 'monitorList',
      keyName: 'key',
    });

    const [handleSubmit, isLoading] = useEventWithLoading(
      async (values: MonitorStatusPageEditFormValues) => {
        await props.onFinish(values);
        form.reset();
      }
    );

    return (
      <Form {...form}>
        <form
          ref={ref}
          onSubmit={form.handleSubmit(handleSubmit)}
          className="flex flex-col space-y-2"
        >
          {/* Title */}
          <FormField
            control={form.control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Title')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Slug */}
          <FormField
            control={form.control}
            name="slug"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Slug')}</FormLabel>
                <FormControl>
                  <AntdInput
                    {...field}
                    addonBefore={
                      width < 280 ? '/status/' : `${window.origin}/status/`
                    }
                  />
                </FormControl>
                <FormDescription>
                  <div className="pt-2">
                    <div>
                      {t('Accept characters')}: <Text code>a-z</Text>{' '}
                      <Text code>0-9</Text> <Text code>-</Text>
                    </div>
                    <div>
                      {t('No consecutive dashes')} <Text code>--</Text>
                    </div>
                  </div>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Description */}
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel optional={true}>{t('Description')}</FormLabel>
                <FormControl>
                  <MarkdownEditorFormItem {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Custom Domain */}
          <FormField
            control={form.control}
            name="domain"
            render={({ field }) => (
              <FormItem>
                <FormLabel optional={true}>{t('Custom Domain')}</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormDescription>
                  <div>
                    {t(
                      'You can config your status page in your own domain, for example: status.example.com'
                    )}
                  </div>
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* MonitorList */}
          <FormField
            control={form.control}
            name="monitorList"
            render={() => (
              <FormItem>
                <FormLabel>{t('Monitor List')}</FormLabel>
                {fields.map((field, i) => (
                  <>
                    {i !== 0 && <Separator className="my-0.5" />}

                    <div key={field.key} className="mb-2 flex flex-col gap-1">
                      <Controller
                        control={form.control}
                        name={`monitorList.${i}.id`}
                        render={({ field }) => <MonitorPicker {...field} />}
                      />

                      <div className="flex flex-1 items-center">
                        <Controller
                          control={form.control}
                          name={`monitorList.${i}.showCurrent`}
                          render={({ field }) => (
                            <Switch
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          )}
                        />

                        <span className="ml-1 flex-1 align-middle text-sm">
                          {t('Show Latest Value')}
                        </span>

                        <LuMinusCircle
                          className="cursor-pointer text-lg"
                          onClick={() => remove(i)}
                        />
                      </div>
                    </div>
                  </>
                ))}
                <FormMessage />

                <Button
                  variant="dashed"
                  type="button"
                  onClick={() =>
                    append({
                      id: '',
                      showCurrent: false,
                    })
                  }
                  style={{ width: '60%' }}
                  Icon={LuPlus}
                >
                  {t('Add Monitor')}
                </Button>
              </FormItem>
            )}
          />

          <div className="!mt-8 flex justify-end gap-2">
            <Button type="submit" loading={isLoading}>
              {props.saveButtonLabel ?? t('Save')}
            </Button>

            {props.onCancel && (
              <Button variant="outline" type="button" onClick={props.onCancel}>
                {t('Cancel')}
              </Button>
            )}
          </div>
        </form>
      </Form>
    );
  });
MonitorStatusPageEditForm.displayName = 'MonitorStatusPageEditForm';

export const MarkdownEditorFormItem: React.FC<{
  value?: string;
  onChange?: (val: string) => void;
}> = React.memo((props) => {
  return <MarkdownEditor value={props.value ?? ''} onChange={props.onChange} />;
});
MarkdownEditorFormItem.displayName = 'MarkdownEditorFormItem';
