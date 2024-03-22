import React, { useState } from 'react';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { hostnameRegex } from '@tianji/shared';
import { useTranslation } from '@i18next-toolkit/react';
import { LuPlus } from 'react-icons/lu';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogOverlay,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useEvent, useEventWithLoading } from '@/hooks/useEvent';
import { Input } from '../ui/input';
import { preventDefault } from '@/utils/dom';
import { trpc } from '@/api/trpc';
import { useCurrentWorkspaceId } from '@/store/user';

const addFormSchema = z.object({
  name: z.string(),
  domain: z.union([z.string().ip(), z.string().regex(hostnameRegex)]),
});

export const AddWebsiteBtn: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const workspaceId = useCurrentWorkspaceId();
  const addWebsiteMutation = trpc.website.add.useMutation();
  const utils = trpc.useUtils();

  const form = useForm<z.infer<typeof addFormSchema>>({
    resolver: zodResolver(addFormSchema),
    defaultValues: {
      name: '',
      domain: '',
    },
  });

  const onSubmit = useEvent(async (values: z.infer<typeof addFormSchema>) => {
    await addWebsiteMutation.mutateAsync({
      workspaceId,
      name: values.name,
      domain: values.domain,
    });

    utils.website.all.refetch();
    form.reset();

    setOpen(false);
  });

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild={false}>
        <Button variant="outline" Icon={LuPlus}>
          {t('Add')}
        </Button>
      </DialogTrigger>
      <DialogContent onPointerDownOutside={preventDefault}>
        <DialogHeader>
          <DialogTitle>{t('Add Website')}</DialogTitle>
          <DialogDescription>{t('Add new website')}</DialogDescription>
        </DialogHeader>

        <div>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
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
              <Button type="submit" loading={addWebsiteMutation.isLoading}>
                {t('Submit')}
              </Button>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
});
AddWebsiteBtn.displayName = 'AddWebsiteBtn';
