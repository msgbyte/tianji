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

const addFormSchema = z.object({
  name: z.string(),
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
