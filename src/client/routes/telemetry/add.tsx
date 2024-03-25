import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { Button } from '@/components/ui/button';
import { useEvent } from '@/hooks/useEvent';
import { useCurrentWorkspaceId } from '@/store/user';
import { trpc } from '@/api/trpc';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { CommonWrapper } from '@/components/CommonWrapper';
import { routeAuthBeforeLoad } from '@/utils/route';
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

export const Route = createFileRoute('/telemetry/add')({
  beforeLoad: routeAuthBeforeLoad,
  component: TelemetryAddComponent,
});

const addFormSchema = z.object({
  name: z.string(),
});

function TelemetryAddComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const addTelemetryMutation = trpc.telemetry.upsert.useMutation();
  const utils = trpc.useUtils();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof addFormSchema>>({
    resolver: zodResolver(addFormSchema),
    defaultValues: {
      name: '',
    },
  });

  const onSubmit = useEvent(async (values: z.infer<typeof addFormSchema>) => {
    const res = await addTelemetryMutation.mutateAsync({
      workspaceId,
      name: values.name,
    });

    utils.telemetry.all.refetch();
    form.reset();

    navigate({
      to: '/telemetry/$telemetryId',
      params: {
        telemetryId: res.id,
      },
    });
  });

  return (
    <CommonWrapper
      header={<h1 className="text-xl font-bold">{t('Add Website')}</h1>}
    >
      <div className="p-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <Card>
              <CardContent className="pt-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Telemetry Name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('Telemetry Name to Display')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" loading={addTelemetryMutation.isLoading}>
                  {t('Create')}
                </Button>
              </CardFooter>
            </Card>
          </form>
        </Form>
      </div>
    </CommonWrapper>
  );
}
