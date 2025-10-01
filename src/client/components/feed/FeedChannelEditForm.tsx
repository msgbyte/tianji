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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { NotificationPicker } from '../notification/NotificationPicker';
import { LuCopy, LuRefreshCcw } from 'react-icons/lu';
import md5 from 'md5';
import dayjs from 'dayjs';
import copy from 'copy-to-clipboard';
import { toast } from 'sonner';

const addFormSchema = z.object({
  name: z.string(),
  webhookSignature: z.string().default(''),
  notificationIds: z.array(z.string()).default([]),
  notifyFrequency: z.enum(['none', 'event', 'day', 'week', 'month']),
  publicShareId: z.string().nullish(),
});

export type FeedChannelEditFormValues = z.infer<typeof addFormSchema>;

interface FeedChannelEditFormProps {
  defaultValues?: FeedChannelEditFormValues;
  onSubmit: (values: FeedChannelEditFormValues) => Promise<void>;
  onRefreshPublicShare?: () => Promise<string | null>;
  onDisablePublicShare?: () => Promise<string | null>;
}
export const FeedChannelEditForm: React.FC<FeedChannelEditFormProps> =
  React.memo((props) => {
    const { t } = useTranslation();

    const form = useForm<FeedChannelEditFormValues>({
      resolver: zodResolver(addFormSchema),
      defaultValues: props.defaultValues ?? {
        name: 'New Channel',
        webhookSignature: '',
        notificationIds: [],
        notifyFrequency: 'none',
        publicShareId: null,
      },
    });

    const publicShareId = form.watch('publicShareId');

    const [handleSubmit, isLoading] = useEventWithLoading(
      async (values: FeedChannelEditFormValues) => {
        await props.onSubmit(values);
        form.reset();
      }
    );

    const [handleRefreshShare, isRefreshingShare] = useEventWithLoading(
      async () => {
        if (!props.onRefreshPublicShare) {
          return;
        }

        const nextShareId = await props.onRefreshPublicShare();
        if (typeof nextShareId !== 'undefined') {
          form.setValue('publicShareId', nextShareId);
        }
      }
    );
    const [handleDisableShare, isDisablingShare] = useEventWithLoading(
      async () => {
        if (!props.onDisablePublicShare) {
          return;
        }

        const nextShareId = await props.onDisablePublicShare();
        if (typeof nextShareId !== 'undefined') {
          form.setValue('publicShareId', nextShareId ?? null);
        }
      }
    );

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
                    <FormLabel>{t('Channel Name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('Channel Name to Display')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="webhookSignature"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional={true}>
                      {t('Webhook Signature')}
                    </FormLabel>
                    <FormControl>
                      <div className="flex">
                        <Input className="rounded-r-none" {...field} />
                        <Button
                          className="rounded-l-none"
                          type="button"
                          Icon={LuRefreshCcw}
                          onClick={() => {
                            form.setValue(
                              'webhookSignature',
                              md5(dayjs().valueOf().toString())
                            );
                          }}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      {t('Optional, Webhook Signature for Incoming Webhook')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notificationIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional={true}>{t('Notification')}</FormLabel>
                    <FormControl>
                      <NotificationPicker
                        className="w-full"
                        {...field}
                        allowClear={true}
                        mode="multiple"
                      />
                    </FormControl>
                    <FormDescription>
                      {t('Select Notification for send')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="notifyFrequency"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Notification Frequency')}</FormLabel>
                    <FormControl>
                      <Select
                        defaultValue={field.value}
                        onValueChange={field.onChange}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">{t('None')}</SelectItem>
                          <SelectItem value="event">
                            {t('Every Event')}
                          </SelectItem>
                          <SelectItem value="day">{t('Every Day')}</SelectItem>
                          <SelectItem value="week">
                            {t('Every Week')}
                          </SelectItem>
                          <SelectItem value="month">
                            {t('Every Month')}
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              {props.onRefreshPublicShare ? (
                <div className="flex w-full flex-col gap-3 sm:w-auto">
                  <div className="text-muted-foreground text-sm font-medium">
                    {t('Public Share')}
                  </div>

                  {publicShareId ? (
                    <>
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                        <Input
                          className="w-full select-all sm:flex-1"
                          value={publicShareId ?? ''}
                          readOnly
                          disabled
                        />
                        <div className="flex gap-2 sm:ml-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            Icon={LuCopy}
                            onClick={() => {
                              if (publicShareId) {
                                copy(publicShareId);
                                toast.success(t('Copied'));
                              }
                            }}
                          >
                            <span className="sr-only">{t('Copy')}</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            Icon={LuRefreshCcw}
                            loading={isRefreshingShare}
                            onClick={handleRefreshShare}
                          >
                            <span className="sr-only">{t('Regenerate')}</span>
                          </Button>
                        </div>
                      </div>

                      {props.onDisablePublicShare ? (
                        <div className="flex flex-wrap gap-2">
                          <Button
                            type="button"
                            variant="destructive"
                            size="sm"
                            loading={isDisablingShare}
                            onClick={handleDisableShare}
                          >
                            {t('Disable Public Share')}
                          </Button>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      loading={isRefreshingShare}
                      onClick={handleRefreshShare}
                    >
                      {t('Enable Public Share')}
                    </Button>
                  )}
                </div>
              ) : null}

              <Button type="submit" loading={isLoading} className="self-end">
                {props.defaultValues ? t('Update') : t('Create')}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    );
  });
FeedChannelEditForm.displayName = 'FeedChannelEditForm';
