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
  name: z.string().min(1, { message: 'Name is required' }).max(100),
});

export type AIGatewayEditFormValues = z.infer<typeof addFormSchema>;

interface AIGatewayEditFormProps {
  defaultValues?: AIGatewayEditFormValues;
  onSubmit: (values: AIGatewayEditFormValues) => Promise<void>;
}
export const AIGatewayEditForm: React.FC<AIGatewayEditFormProps> = React.memo(
  (props) => {
    const { t } = useTranslation();

    const form = useForm<AIGatewayEditFormValues>({
      resolver: zodResolver(addFormSchema),
      defaultValues: props.defaultValues ?? {
        name: 'New Gateway',
      },
    });

    const [handleSubmit, isLoading] = useEventWithLoading(
      async (values: AIGatewayEditFormValues) => {
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
AIGatewayEditForm.displayName = 'AIGatewayEditForm';
