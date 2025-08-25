import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { Layout } from '@/components/layout';
import { CommonWrapper } from '@/components/CommonWrapper';
import { CommonHeader } from '@/components/CommonHeader';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { trpc, defaultErrorHandler } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Radio, Space } from 'antd';
import { ConnectionStringEditor } from '@/components/insights/warehouse/ConnectionStringEditor';
import { Textarea } from '@/components/ui/textarea';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';

export const Route = createFileRoute('/insights/warehouse/connections/create')({
  component: PageComponent,
});

const connectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional().default(''),
  dbDriver: z.enum(['mysql']),
  connectionUri: z.string().min(1, 'Connection URI is required'),
});

type ConnectionFormValues = z.infer<typeof connectionSchema>;

function PageComponent() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const workspaceId = useCurrentWorkspaceId();

  const upsertMutation = trpc.insights.warehouse.database.upsert.useMutation({
    onError: defaultErrorHandler,
  });

  const form = useForm<ConnectionFormValues>({
    resolver: zodResolver(connectionSchema),
    defaultValues: {
      name: '',
      description: '',
      dbDriver: 'mysql',
      connectionUri: '',
    },
  });

  const onSubmit = async (values: ConnectionFormValues) => {
    await upsertMutation.mutateAsync({
      workspaceId,
      name: values.name.trim(),
      description: values.description ?? '',
      connectionUri: values.connectionUri.trim(),
      dbDriver: values.dbDriver,
    });
    navigate({ to: '../' });
  };

  return (
    <Layout>
      <CommonWrapper header={<CommonHeader title={t('Create connection')} />}>
        <ScrollArea className="h-full overflow-hidden p-4">
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mx-auto w-full max-w-3xl space-y-4"
            >
              <Card>
                <CardHeader>
                  <CardTitle>{t('Basic info')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Name')}</FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t('Please enter a name for display')}
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
                        <FormLabel optional={true}>
                          {t('Description')}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            rows={4}
                            placeholder={t(
                              'Please enter a description which only for display'
                            )}
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('Integration type')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="dbDriver"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Radio.Group
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          >
                            <Space direction="vertical">
                              <Radio value={'mysql'}>MySQL</Radio>
                            </Space>
                          </Radio.Group>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('Connection')}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <FormField
                    control={form.control}
                    name="connectionUri"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('Connection')}</FormLabel>
                        <FormControl>
                          <ConnectionStringEditor
                            driver={form.watch('dbDriver')}
                            value={field.value}
                            onChange={(v) => field.onChange(v)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>
              </Card>

              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate({ to: '../' })}
                >
                  {t('Cancel')}
                </Button>
                <Button type="submit" loading={form.formState.isSubmitting}>
                  {t('Create')}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </CommonWrapper>
    </Layout>
  );
}
