import { useTranslation } from '@i18next-toolkit/react';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { useEventWithLoading } from '@/hooks/useEvent';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
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
import { Switch } from '@/components/ui/switch';

const aiRouterFormSchema = z.object({
  name: z.string().min(1, { message: 'Name is required' }).max(100),
  enabled: z.boolean().default(true),
});

export type AIRouterEditFormValues = z.infer<typeof aiRouterFormSchema>;

interface AIRouterEditFormProps {
  defaultValues?: AIRouterEditFormValues;
  onSubmit: (values: AIRouterEditFormValues) => Promise<void>;
}

export const AIRouterEditForm: React.FC<AIRouterEditFormProps> = React.memo(
  (props) => {
    const { t } = useTranslation();
    const form = useForm<AIRouterEditFormValues>({
      resolver: zodResolver(aiRouterFormSchema),
      defaultValues: props.defaultValues ?? {
        name: 'New AI Router',
        enabled: true,
      },
    });

    const [handleSubmit, isLoading] = useEventWithLoading(async (values) => {
      await props.onSubmit(values);
      form.reset(values);
    });

    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-8">
          <Card>
            <CardContent className="space-y-4 pt-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Router Name')}</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      {t('Name shown in AI Router list and logs.')}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="enabled"
                render={({ field }) => (
                  <FormItem>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel>{t('Enabled')}</FormLabel>
                    </div>
                    <FormDescription>
                      {t('Disabled routers reject runtime requests.')}
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

AIRouterEditForm.displayName = 'AIRouterEditForm';
