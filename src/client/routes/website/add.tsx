import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { useTranslation } from '@i18next-toolkit/react';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useEvent } from '@/hooks/useEvent';
import { Input } from '@/components/ui/input';
import { useCurrentWorkspaceId } from '@/store/user';
import { defaultErrorHandler, trpc } from '@/api/trpc';
import { hostnameRegex } from '@tianji/shared';
import { Card, CardContent, CardFooter } from '@/components/ui/card';
import { CommonWrapper } from '@/components/CommonWrapper';

export const Route = createFileRoute('/website/add')({
  beforeLoad: routeAuthBeforeLoad,
  component: WebsiteAddComponent,
});

const addFormSchema = z.object({
  name: z.string(),
  domain: z.union([z.ipv4(), z.ipv6(), z.string().regex(hostnameRegex)]),
});

function WebsiteAddComponent() {
  const { t } = useTranslation();
  const workspaceId = useCurrentWorkspaceId();
  const addWebsiteMutation = trpc.website.add.useMutation({
    onError: defaultErrorHandler,
  });
  const utils = trpc.useUtils();
  const navigate = useNavigate();

  const form = useForm<z.infer<typeof addFormSchema>>({
    resolver: zodResolver(addFormSchema),
    defaultValues: {
      name: '',
      domain: '',
    },
  });

  const onSubmit = useEvent(async (values: z.infer<typeof addFormSchema>) => {
    const res = await addWebsiteMutation.mutateAsync({
      workspaceId,
      name: values.name,
      domain: values.domain,
    });

    utils.website.all.refetch();
    form.reset();

    navigate({
      to: '/website/$websiteId',
      params: {
        websiteId: res.id,
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
                      <FormLabel>{t('Website Name')}</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormDescription>
                        {t('Website Name to Display')}
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="domain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('Domain')}</FormLabel>
                      <FormControl>
                        <Input placeholder="example.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter>
                <Button type="submit" loading={addWebsiteMutation.isPending}>
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
