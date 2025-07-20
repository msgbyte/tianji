import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { Card, CardContent } from '@/components/ui/card';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { CodeEditor } from '@/components/CodeEditor';
import { Switch } from '@/components/ui/switch';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { trpc } from '@/api/trpc';
import { defaultErrorHandler } from '@/api/trpc';

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  code: z.string().min(1, 'Code is required'),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

export const Route = createFileRoute('/worker/add')({
  beforeLoad: routeAuthBeforeLoad,
  component: WorkerAddComponent,
});

const defaultCode = `function fetch() {
  return 'Hello, World!';
}
`;

function WorkerAddComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const navigate = useNavigate();
  const mutation = trpc.worker.upsert.useMutation({
    onError: defaultErrorHandler,
  });
  const trpcUtils = trpc.useUtils();

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      code: defaultCode,
    },
  });

  const handleSubmit = useEvent(async (values: FormValues) => {
    const res = await mutation.mutateAsync({
      ...values,
      workspaceId,
    });

    trpcUtils.worker.all.invalidate();
    navigate({
      to: '/worker/$workerId',
      params: {
        workerId: res.id,
      },
    });
  });

  return (
    <CommonWrapper header={<CommonHeader title={t('Add Function Worker')} />}>
      <ScrollArea className="h-full overflow-hidden p-4">
        <Card>
          <CardContent className="pt-4">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(handleSubmit)}
                className="space-y-6"
              >
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Name')}</FormLabel>
                      <FormControl>
                        <Input
                          placeholder={t('Enter worker name')}
                          {...field}
                        />
                      </FormControl>
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
                          placeholder={t('Enter worker description')}
                          {...field}
                          rows={3}
                        />
                      </FormControl>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <Button type="submit" loading={mutation.isPending}>
                  {t('Create Worker')}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </ScrollArea>
    </CommonWrapper>
  );
}
