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
import { AppStoreSearchInput } from './AppStoreSearchInput';

const addFormSchema = z.object({
  name: z.string(),
  appstoreId: z.string().optional(),
  playstoreId: z.string().optional(),
});

export type ApplicationEditFormValues = z.infer<typeof addFormSchema>;

interface ApplicationEditFormProps {
  defaultValues?: ApplicationEditFormValues;
  onSubmit: (values: ApplicationEditFormValues) => Promise<void>;
}
export const ApplicationEditForm: React.FC<ApplicationEditFormProps> =
  React.memo((props) => {
    const { t } = useTranslation();

    const form = useForm<ApplicationEditFormValues>({
      resolver: zodResolver(addFormSchema),
      defaultValues: props.defaultValues ?? {
        name: 'New Application',
      },
    });

    const [handleSubmit, isLoading] = useEventWithLoading(
      async (values: ApplicationEditFormValues) => {
        await props.onSubmit({ ...values });
        form.reset();
      }
    );

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card>
            <CardContent className="space-y-2 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Application Name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('Application Name to Display')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="appstoreId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional={true}>{t('Appstore ID')}</FormLabel>
                    <FormControl>
                      <AppStoreSearchInput
                        value={field.value || ''}
                        onChange={field.onChange}
                        storeType="appstore"
                        placeholder="id12345xxxx"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="playstoreId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional={true}>{t('Playstore ID')}</FormLabel>
                    <FormControl>
                      <AppStoreSearchInput
                        value={field.value || ''}
                        onChange={field.onChange}
                        storeType="googleplay"
                        placeholder="com.example.xxx"
                      />
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
ApplicationEditForm.displayName = 'ApplicationEditForm';
