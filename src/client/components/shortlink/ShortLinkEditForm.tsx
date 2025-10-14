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
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';

const formSchema = z.object({
  originalUrl: z.string().url('Please enter a valid URL'),
  code: z
    .string()
    .regex(/^[a-zA-Z0-9_-]*$/, 'Only letters, numbers, hyphens and underscores')
    .max(50, 'Short code must be less than 50 characters')
    .optional()
    .or(z.literal('')),
  title: z
    .string()
    .max(200, 'Title must be less than 200 characters')
    .optional(),
  description: z
    .string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  enabled: z.boolean().optional(),
});

export type ShortLinkEditFormValues = z.infer<typeof formSchema>;

interface ShortLinkEditFormProps {
  defaultValues?: Partial<ShortLinkEditFormValues>;
  isEdit?: boolean;
  onSubmit: (values: ShortLinkEditFormValues) => Promise<void>;
}

export const ShortLinkEditForm: React.FC<ShortLinkEditFormProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const { isEdit = false } = props;

    const form = useForm<ShortLinkEditFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: props.defaultValues ?? {
        originalUrl: '',
        code: '',
        title: '',
        description: '',
        enabled: true,
      },
    });

    const [handleSubmit, isLoading] = useEventWithLoading(
      async (values: ShortLinkEditFormValues) => {
        await props.onSubmit(values);
      }
    );

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="originalUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Original URL')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://example.com/very-long-url"
                      />
                    </FormControl>
                    <FormDescription>
                      {t('The original URL to redirect to')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="code"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional={true}>{t('Short Code')}</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder={t('Auto generate if empty')}
                        disabled={isEdit}
                      />
                    </FormControl>
                    <FormDescription>
                      {isEdit
                        ? t('Short code cannot be modified')
                        : t('Custom short code (leave empty to auto-generate)')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional={true}>{t('Title')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('Optional title')} />
                    </FormControl>
                    <FormDescription>
                      {t('A descriptive title for this short link')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel optional={true}>{t('Description')}</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder={t('Optional description')}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('Additional notes about this short link')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isEdit && (
                <FormField
                  control={form.control}
                  name="enabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel>{t('Enabled')}</FormLabel>
                        <FormDescription>
                          {t('Enable or disable this short link')}
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
              )}
            </CardContent>
            <CardFooter>
              <Button type="submit" loading={isLoading}>
                {isEdit ? t('Update') : t('Create')}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    );
  }
);

ShortLinkEditForm.displayName = 'ShortLinkEditForm';
