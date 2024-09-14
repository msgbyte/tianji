import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useCurrentWorkspace } from '../../store/user';
import { CommonHeader } from '@/components/CommonHeader';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Typography } from 'antd';
import {
  AppRouterOutput,
  defaultErrorHandler,
  defaultSuccessHandler,
  trpc,
} from '@/api/trpc';
import { createColumnHelper, DataTable } from '@/components/DataTable';
import { useMemo, useState } from 'react';
import { get } from 'lodash-es';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useEventWithLoading } from '@/hooks/useEvent';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { AlertConfirm } from '@/components/AlertConfirm';
import { ROLES } from '@tianji/shared';

export const Route = createFileRoute('/settings/workspace')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

const inviteFormSchema = z.object({
  email: z.string().email(),
});

type InviteFormValues = z.infer<typeof inviteFormSchema>;

type MemberInfo = AppRouterOutput['workspace']['members'][number];
const columnHelper = createColumnHelper<MemberInfo>();

function PageComponent() {
  const { t } = useTranslation();
  const { id: workspaceId, name, role } = useCurrentWorkspace();
  const { data: members = [], refetch: refetchMembers } =
    trpc.workspace.members.useQuery({
      workspaceId,
    });
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: {
      email: '',
    },
  });
  const inviteMutation = trpc.workspace.invite.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const deleteWorkspaceMutation = trpc.workspace.delete.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });

  const [handleInvite, isLoading] = useEventWithLoading(
    async (values: InviteFormValues) => {
      await inviteMutation.mutateAsync({
        workspaceId,
        targetUserEmail: values.email,
      });
      form.reset();

      refetchMembers();
    }
  );

  const columns = useMemo(() => {
    return [
      columnHelper.accessor(
        (data) =>
          get(data, ['user', 'nickname']) || get(data, ['user', 'username']),
        {
          header: t('Name'),
          size: 300,
        }
      ),
      columnHelper.accessor('user.email', {
        header: t('Email'),
        size: 130,
        cell: (props) => {
          return (
            <span>
              {props.getValue()}
              {props.row.original.user.emailVerified && (
                <Badge className="ml-1">{t('Verified')}</Badge>
              )}
            </span>
          );
        },
      }),
      columnHelper.accessor('role', {
        header: t('Role'),
        size: 130,
      }),
    ];
  }, [t]);

  return (
    <CommonWrapper header={<CommonHeader title={t('Workspace')} />}>
      <ScrollArea className="h-full overflow-hidden p-4">
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader className="text-lg font-bold">
              {t('Current Workspace:')} {name}
            </CardHeader>
            <CardContent>
              <div>
                <span className="mr-2">{t('Workspace ID')}:</span>
                <span>
                  <Typography.Text code={true} copyable={true}>
                    {workspaceId}
                  </Typography.Text>
                </span>
              </div>
            </CardContent>
          </Card>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleInvite)}>
              <Card>
                <CardHeader className="text-lg font-bold">
                  {t('Invite new members by email address')}
                </CardHeader>
                <CardContent>
                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem className="max-w-[320px]">
                        <FormLabel />
                        <FormControl>
                          <Input placeholder="jane@example.com" {...field} />
                        </FormControl>
                        <FormDescription />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </CardContent>

                <CardFooter>
                  <Button type="submit" loading={isLoading}>
                    {t('Invite')}
                  </Button>
                </CardFooter>
              </Card>
            </form>
          </Form>

          <Card>
            <CardHeader className="text-lg font-bold">
              {t('Members')}
            </CardHeader>
            <CardContent>
              <DataTable columns={columns} data={members} />
            </CardContent>
          </Card>

          {role === ROLES.owner && (
            <Card>
              <CardHeader className="text-lg font-bold">
                {t('Danger Zone')}
              </CardHeader>
              <CardContent>
                <div>
                  <AlertConfirm
                    title={'Confirm to delete this workspace'}
                    description={t(
                      'All content in this workspace will be destory and can not recover.'
                    )}
                    onConfirm={async () => {
                      await deleteWorkspaceMutation.mutateAsync({
                        workspaceId,
                      });

                      setTimeout(() => {
                        window.location.reload();
                      }, 1000);
                    }}
                  >
                    <Button
                      type="button"
                      loading={deleteWorkspaceMutation.isLoading}
                      variant="destructive"
                    >
                      {t('Delete Workspace')}
                    </Button>
                  </AlertConfirm>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </ScrollArea>
    </CommonWrapper>
  );
}
