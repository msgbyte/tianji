import { useTranslation } from '@i18next-toolkit/react';
import { Button } from '@/components/ui/button';
import { useEventWithLoading } from '@/hooks/useEvent';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { z } from 'zod';
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
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { generateRandomString } from '@/utils/common';
import { LuArrowDown, LuArrowUp, LuMinus, LuPlus } from 'react-icons/lu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import React, { useState } from 'react';
import { TipIcon } from '../TipIcon';
import { cn } from '@/utils/style';
import { Switch } from '../ui/switch';
import { FeedChannelPicker } from '../feed/FeedChannelPicker';

const addFormSchema = z.object({
  name: z.string(),
  payload: z.object({
    items: z.array(
      z.object({
        label: z.string(),
        name: z.string(),
        type: z.enum(['text', 'select', 'email', 'imageUrl']),
        options: z.array(z.string()).optional(),
      })
    ),
  }),
  feedChannelIds: z.array(z.string()),
  feedTemplate: z.string(),
  webhookUrl: z.string().url().or(z.literal('')),
});

export type SurveyEditFormValues = z.infer<typeof addFormSchema>;

function generateDefaultItem() {
  return {
    label: 'New Field',
    name: 'field_' + generateRandomString(4),
    type: 'text' as const,
  };
}

interface SurveyEditFormProps {
  defaultValues?: SurveyEditFormValues;
  onSubmit: (values: SurveyEditFormValues) => Promise<void>;
}
export const SurveyEditForm: React.FC<SurveyEditFormProps> = React.memo(
  (props) => {
    const { t } = useTranslation();

    const [advancedMode, setAdvancedMode] = useState(false);

    const form = useForm<SurveyEditFormValues>({
      resolver: zodResolver(addFormSchema),
      defaultValues: props.defaultValues ?? {
        name: 'New Survey',
        payload: {
          items: [generateDefaultItem()],
        },
        feedChannelIds: [],
        feedTemplate: '',
        webhookUrl: '',
      },
    });

    const feedChannelIds = form.watch('feedChannelIds');

    const [handleSubmit, isLoading] = useEventWithLoading(
      async (values: SurveyEditFormValues) => {
        await props.onSubmit({ ...values });
        form.reset();
      }
    );

    const { fields, append, swap, insert, remove } = useFieldArray({
      control: form.control,
      name: 'payload.items',
    });

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card>
            <CardContent className="pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Survey Name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('Survey Name to Display')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="border-muted mt-2 rounded-lg border p-4">
                <h2 className="mb-2 font-bold leading-6">{t('Form Info')}</h2>
                <div className="flex items-center justify-end gap-2">
                  <Switch
                    checked={advancedMode}
                    onCheckedChange={(checked) => setAdvancedMode(checked)}
                  />
                  <div className="text-sm">{t('Advanced Mode')}</div>
                </div>

                {fields.map((field, i) => (
                  <div key={field.id} className="mb-2 flex gap-1">
                    <FormItem>
                      <FormLabel>{t('Display Label')}</FormLabel>
                      <FormControl>
                        <Input {...form.register(`payload.items.${i}.label`)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>

                    {advancedMode && (
                      <FormItem>
                        <FormLabel>
                          {t('Name')}
                          <TipIcon
                            className="ml-1"
                            content={t('Use for storage')}
                          />
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...form.register(`payload.items.${i}.name`)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}

                    <FormItem>
                      <FormLabel>{t('Type')}</FormLabel>
                      <FormControl>
                        <Select
                          defaultValue="text"
                          onValueChange={(val) =>
                            form.setValue(`payload.items.${i}.type`, val as any)
                          }
                        >
                          <SelectTrigger
                            className="w-[100px]"
                            {...form.register(`payload.items.${i}.type`)}
                          >
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">{t('Text')}</SelectItem>
                            <SelectItem value="email">{t('Email')}</SelectItem>
                            <SelectItem value="imageUrl">
                              {t('Image Url')}
                            </SelectItem>
                            {/* <SelectItem value="select">
                              {t('Select')}
                            </SelectItem> */}
                          </SelectContent>
                        </Select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>

                    {/* actions */}
                    <div className="grid min-w-10 grid-flow-col grid-cols-2 grid-rows-2 gap-0.5 self-end">
                      <Button
                        type="button"
                        variant="dashed"
                        size="icon"
                        className="h-5 w-5 text-xs"
                        Icon={LuMinus}
                        onClick={() => {
                          remove(i);
                        }}
                      />
                      <Button
                        type="button"
                        variant="dashed"
                        size="icon"
                        className="h-5 w-5 text-xs"
                        Icon={LuPlus}
                        onClick={() => {
                          insert(i + 1, generateDefaultItem());
                        }}
                      />
                      <Button
                        type="button"
                        variant="dashed"
                        size="icon"
                        className={cn(
                          'h-5 w-5 text-xs',
                          i === 0 && 'opacity-0'
                        )}
                        Icon={LuArrowUp}
                        onClick={() => {
                          swap(i, i - 1);
                        }}
                      />
                      <Button
                        type="button"
                        variant="dashed"
                        size="icon"
                        className={cn(
                          'h-5 w-5 text-xs',
                          i === fields.length - 1 && 'opacity-0'
                        )}
                        Icon={LuArrowDown}
                        onClick={() => {
                          swap(i, i + 1);
                        }}
                      />
                    </div>
                  </div>
                ))}

                <div className="mt-2 flex justify-end">
                  <Button
                    variant="dashed"
                    type="button"
                    Icon={LuPlus}
                    size="icon"
                    onClick={() => append(generateDefaultItem())}
                  />
                </div>
              </div>

              <FormField
                control={form.control}
                name="feedChannelIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional={true}>{t('Feed Channels')}</FormLabel>
                    <FormControl className="w-full">
                      <FeedChannelPicker
                        allowClear={true}
                        mode="multiple"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('Select Feed Channel for send')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {feedChannelIds.length > 0 && (
                <FormField
                  control={form.control}
                  name="feedTemplate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Feed Template')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="survey {{_surveyName}} receive a new record."
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        <p>
                          {t(
                            'Survey Template String, here are available variables:'
                          )}
                        </p>
                        <p>
                          {'{{_surveyName}} '}
                          {fields.map((f) => `{{${f.name}}}`).join(' ')}
                        </p>
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              <FormField
                control={form.control}
                name="webhookUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional={true}>{t('Webhook Url')}</FormLabel>
                    <FormControl className="w-full">
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('Optional, webhook url to send survey payload')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter>
              <Button type="submit" loading={isLoading}>
                {props.defaultValues ? t('Update') : t('Create')}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    );
  }
);
SurveyEditForm.displayName = 'SurveyEditForm';
