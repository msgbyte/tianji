import React from 'react';
import { MonitorPicker } from '../MonitorPicker';
import { useTranslation } from '@i18next-toolkit/react';
import { Button } from '@/components/ui/button';
import { LuCircleMinus, LuPlus } from 'react-icons/lu';
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
import { Collapsible, CollapsibleContent } from '@/components/ui/collapsible';
import { CollapsibleTrigger } from '@radix-ui/react-collapsible';
import { CaretSortIcon } from '@radix-ui/react-icons';
import { DeprecatedBadge } from '@/components/DeprecatedBadge';
import { MonitorStatusPageServiceList } from './ServiceList';
import { bodySchema } from './schema';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { HtmlEditor } from '@/components/CodeEditor/html';

const Text = Typography.Text;

export const pageTypeSchema = z.enum(['status', 'static']).default('status');
export type PageType = z.infer<typeof pageTypeSchema>;

const editFormSchema = z.object({
  type: pageTypeSchema,
  title: z.string(),
  slug: z.string().regex(slugRegex),
  description: z.string(),
  domain: z
    .string()
    .regex(domainRegex, 'Invalid domain')
    .or(z.literal(''))
    .optional(),
  body: bodySchema,
  payload: z
    .object({
      html: z.string(),
    })
    .optional(),

  /**
   * @deprecated
   */
  monitorList: z.array(
    z.object({
      id: z.string(),
      showCurrent: z.boolean().default(false).optional(),
      showDetail: z.boolean().default(true).optional(),
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
        type: 'status',
        title: '',
        slug: '',
        description: '',
        domain: '',
        monitorList: [],
        body: { groups: [] },
        payload: { html: '' },
      },
    });

    const pageType = form.watch('type');

    const showDeprecatedMonitorList = props.initialValues
      ? Array.isArray(props.initialValues.monitorList) &&
        props.initialValues.monitorList.length > 0
      : false;

    const {
      fields: oldMonitorFields,
      append,
      remove,
    } = useFieldArray({
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
          {/* Type */}
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('Type')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="status">{t('Status Page')}</SelectItem>
                    <SelectItem value="static">{t('Static Page')}</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

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
            render={({ field }) => {
              const slugPrefix = pageType === 'static' ? '/p/' : '/status/';
              return (
                <FormItem>
                  <FormLabel>{t('Slug')}</FormLabel>
                  <FormControl>
                    <AntdInput
                      {...field}
                      addonBefore={
                        width < 280
                          ? slugPrefix
                          : `${window.origin}${slugPrefix}`
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
              );
            }}
          />

          <Collapsible>
            <CollapsibleTrigger className="flex w-full items-center justify-between">
              <span className="text-sm">{t('Advanced')}</span>
              <CaretSortIcon className="h-4 w-4" />
            </CollapsibleTrigger>
            <CollapsibleContent>
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
            </CollapsibleContent>
          </Collapsible>

          {/* Body - Status Page */}
          {pageType === 'status' && (
            <FormField
              control={form.control}
              name="body.groups"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('Body')}</FormLabel>
                  <FormControl>
                    <MonitorStatusPageServiceList
                      {...field}
                      value={field.value ?? []}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* HTML Content - Static Page */}
          {pageType === 'static' && (
            <FormField
              control={form.control}
              name="payload.html"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>{t('HTML Content')}</FormLabel>
                  <FormControl>
                    <div className="overflow-hidden rounded-md border">
                      <HtmlEditor
                        value={field.value ?? ''}
                        onChange={field.onChange}
                        height={400}
                      />
                    </div>
                  </FormControl>
                  <FormDescription>
                    {t(
                      'Write HTML code that will be rendered in the static page'
                    )}
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
          )}

          {/* MonitorList - Status Page (Deprecated) */}
          {pageType === 'status' && showDeprecatedMonitorList && (
            <FormField
              control={form.control}
              name="monitorList"
              render={() => (
                <FormItem className="opacity-50">
                  <FormLabel>
                    {t('Monitor List')}
                    <DeprecatedBadge tip={t('Please use Body field')} />
                  </FormLabel>
                  {oldMonitorFields.map((field, i) => (
                    <>
                      {i !== 0 && <Separator />}

                      <div key={field.key} className="mb-2 flex flex-col gap-2">
                        <Controller
                          control={form.control}
                          name={`monitorList.${i}.id`}
                          render={({ field }) => (
                            <MonitorPicker
                              {...field}
                              value={field.value}
                              onValueChange={field.onChange}
                            />
                          )}
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

                          <Controller
                            control={form.control}
                            name={`monitorList.${i}.showDetail`}
                            render={({ field }) => (
                              <Switch
                                className="ml-4"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            )}
                          />

                          <span className="ml-1 flex-1 align-middle text-sm">
                            {t('Show Detail')}
                          </span>

                          <LuCircleMinus
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
                        showDetail: true,
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
          )}

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
