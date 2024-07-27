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

const addFormSchema = z.object({
  name: z.string(),
  notificationIds: z.array(z.string()).default([]),
  notifyFrequency: z.enum(['none', 'event', 'day', 'week', 'month']),
});

export type FeedChannelEditFormValues = z.infer<typeof addFormSchema>;

interface FeedChannelEditFormProps {
  defaultValues?: FeedChannelEditFormValues;
  onSubmit: (values: FeedChannelEditFormValues) => Promise<void>;
}
export const FeedChannelEditForm: React.FC<FeedChannelEditFormProps> =
  React.memo((props) => {
    const { t } = useTranslation();

    const form = useForm<FeedChannelEditFormValues>({
      resolver: zodResolver(addFormSchema),
      defaultValues: props.defaultValues ?? {
        name: 'New Channel',
        notificationIds: [],
        notifyFrequency: 'none',
      },
    });

    const [handleSubmit, isLoading] = useEventWithLoading(
      async (values: FeedChannelEditFormValues) => {
        await props.onSubmit(values);
        form.reset();
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
                name="notificationIds"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Notification')}</FormLabel>
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

            <CardFooter>
              <Button type="submit" loading={isLoading}>
                {props.defaultValues ? t('Update') : t('Create')}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    );
  });
FeedChannelEditForm.displayName = 'FeedChannelEditForm';
