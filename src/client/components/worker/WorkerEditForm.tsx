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
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import React from 'react';
import { CodeEditor } from '@/components/CodeEditor';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  code: z.string().min(1, 'Code is required'),
  active: z.boolean().default(true),
});

const defaultCode = `function fetch() {
  return 'Hello, World!';
}
`;

export type WorkerEditFormValues = z.infer<typeof formSchema>;

interface WorkerEditFormProps {
  defaultValues?: Partial<WorkerEditFormValues>;
  onSubmit: (values: WorkerEditFormValues) => Promise<void>;
}

export const WorkerEditForm: React.FC<WorkerEditFormProps> = React.memo(
  (props) => {
    const { t } = useTranslation();

    const form = useForm<WorkerEditFormValues>({
      resolver: zodResolver(formSchema),
      defaultValues: {
        name: '',
        description: '',
        code: defaultCode,
        active: true,
        ...props.defaultValues,
      },
    });

    const [handleSubmit, isLoading] = useEventWithLoading(
      async (values: WorkerEditFormValues) => {
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
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('Name')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('Enter worker name')} />
                    </FormControl>
                    <FormDescription>
                      {t('A descriptive name for this worker')}
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
                        placeholder={t('Enter worker description')}
                        rows={3}
                      />
                    </FormControl>
                    <FormDescription>
                      {t('Optional description of what this worker does')}
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
                    <FormLabel>{t('JavaScript Code')}</FormLabel>
                    <FormControl>
                      <CodeEditor
                        height={400}
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormDescription>
                      {t(
                        'Write your JavaScript code that will be executed by this worker'
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>

            <CardFooter>
              <Button type="submit" loading={isLoading}>
                {props.defaultValues?.name
                  ? t('Update Worker')
                  : t('Create Worker')}
              </Button>
            </CardFooter>
          </Card>
        </form>
      </Form>
    );
  }
);

WorkerEditForm.displayName = 'WorkerEditForm';
