import { routeAuthBeforeLoad } from '@/utils/route';
import { createFileRoute, Link } from '@tanstack/react-router';
import { useTranslation } from '@i18next-toolkit/react';
import { CommonWrapper } from '@/components/CommonWrapper';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useCurrentWorkspace,
  useIsWorkspaceOwner,
  useHasAdminPermission,
  useUserStore,
} from '../../store/user';
import { CommonHeader } from '@/components/CommonHeader';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Typography } from 'antd';
import { defaultErrorHandler, defaultSuccessHandler, trpc } from '@/api/trpc';
import { useEffect, useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { useEvent, useEventWithLoading } from '@/hooks/useEvent';
import { z } from 'zod';
import { AlertConfirm } from '@/components/AlertConfirm';
import { ROLES } from '@tianji/shared';
import { cn } from '@/utils/style';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { getTimezoneList } from '@/utils/date';
import { useWorkspaceMembers } from '@/components/workspace/useWorkspaceMembers';
import { useGlobalConfig } from '@/hooks/useConfig';
import { SimpleTooltip } from '@/components/ui/tooltip';
import {
  LuIdCard,
  LuInfo,
  LuMail,
  LuTriangleAlert,
  LuUserPlus,
  LuZap,
} from 'react-icons/lu';
import { toast } from 'sonner';

export const Route = createFileRoute('/settings/workspace')({
  beforeLoad: routeAuthBeforeLoad,
  component: PageComponent,
});

type InviteMode = 'userId' | 'email';

type InviteFormValues = {
  emailOrId: string;
  role: ROLES.readOnly | ROLES.write | ROLES.admin;
};

function getWorkspaceInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return 'W';
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function PageComponent() {
  const { t } = useTranslation();
  const { id: workspaceId, name, role, settings } = useCurrentWorkspace();
  const hasAdminPermission = useHasAdminPermission();
  const isWorkspaceOwner = useIsWorkspaceOwner();
  const trpcUtils = trpc.useUtils();
  const updateCurrentWorkspaceName = useUserStore(
    (state) => state.updateCurrentWorkspaceName
  );
  const updateCurrentWorkspaceSettings = useUserStore(
    (state) => state.updateCurrentWorkspaceSettings
  );
  const globalConfig = useGlobalConfig();
  const smtpUnavailableMessage = t(
    'SMTP service is not configured on the server, invitation emails will not be sent'
  );

  const [inviteMode, setInviteMode] = useState<InviteMode>('userId');
  const isUserIdMode = inviteMode === 'userId';

  const inviteResolver = useMemo(
    () => async (values: InviteFormValues) => {
      const trimmed = values.emailOrId.trim();
      const errors: Partial<
        Record<keyof InviteFormValues, { type: string; message: string }>
      > = {};

      if (!trimmed) {
        errors.emailOrId = {
          type: 'manual',
          message: isUserIdMode
            ? t('Please enter a User ID')
            : t('Please enter an email address'),
        };
      } else if (
        !isUserIdMode &&
        !z.string().email().safeParse(trimmed).success
      ) {
        errors.emailOrId = {
          type: 'manual',
          message: t('Please enter a valid email address'),
        };
      } else if (isUserIdMode && trimmed.includes('@')) {
        errors.emailOrId = {
          type: 'manual',
          message: t(
            'This looks like an email address. Switch to the "By Email" tab to invite by email.'
          ),
        };
      }

      if (Object.keys(errors).length > 0) {
        return { values: {}, errors };
      }

      return {
        values: {
          ...values,
          emailOrId: trimmed,
        },
        errors: {},
      };
    },
    [isUserIdMode, t]
  );

  const { tableEl: workspaceMembersTable, memberCount } = useWorkspaceMembers();
  const form = useForm<InviteFormValues>({
    resolver: inviteResolver,
    defaultValues: {
      emailOrId: '',
      role: ROLES.readOnly,
    },
  });

  const selectedRole = form.watch('role');

  useEffect(() => {
    if (!isWorkspaceOwner && selectedRole === ROLES.admin) {
      form.setValue('role', ROLES.readOnly);
    }
  }, [workspaceId, isWorkspaceOwner, selectedRole, form]);

  const inviteMutation = trpc.workspace.invite.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const renameWorkspaceMutation = trpc.workspace.rename.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const deleteWorkspaceMutation = trpc.workspace.delete.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const updateSettings = trpc.workspace.updateSettings.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });
  const recheckPauseStatusMutation =
    trpc.workspace.recheckPauseStatus.useMutation({
      onSuccess: defaultSuccessHandler,
      onError: defaultErrorHandler,
    });

  const [renameWorkspaceName, setRenameWorkspaceName] = useState('');
  const [handleRename, isRenameLoading] = useEventWithLoading(async () => {
    await renameWorkspaceMutation.mutateAsync({
      workspaceId,
      name: renameWorkspaceName,
    });

    updateCurrentWorkspaceName(renameWorkspaceName);
  });

  const handleModeChange = useEvent((nextMode: string) => {
    if (nextMode !== 'userId' && nextMode !== 'email') {
      return;
    }
    setInviteMode(nextMode);
    form.clearErrors('emailOrId');
  });

  const [handleInvite, isInviteLoading] = useEventWithLoading(
    async (values: InviteFormValues) => {
      await inviteMutation.mutateAsync({
        workspaceId,
        emailOrId: values.emailOrId.trim(),
        role: values.role,
      });
      form.reset({
        emailOrId: '',
        role: values.role,
      });

      trpcUtils.workspace.members.invalidate({
        workspaceId,
      });
    }
  );

  const handleUpdateSettings = useEvent(async (key: string, value: string) => {
    const { settings } = await updateSettings.mutateAsync({
      workspaceId,
      settings: {
        [key]: value,
      },
    });

    updateCurrentWorkspaceSettings(settings);
  });

  const timezoneList = useMemo(() => getTimezoneList(), []);

  const roleDescriptionMap: Record<
    ROLES.readOnly | ROLES.write | ROLES.admin,
    string
  > = {
    [ROLES.readOnly]: t(
      'Read Only: Can view dashboards, websites, and monitors without making changes.'
    ),
    [ROLES.write]: t(
      'Write: Can create and edit resources, but cannot delete them or manage members.'
    ),
    [ROLES.admin]: t(
      'Admin: Full workspace management including adding members.'
    ),
  };

  const currentRoleLabelMap: Record<string, string> = {
    [ROLES.owner]: t('Owner'),
    [ROLES.admin]: t('Admin'),
    [ROLES.write]: t('Write'),
    [ROLES.readOnly]: t('Read Only'),
  };

  return (
    <CommonWrapper header={<CommonHeader title={t('Workspace')} />}>
      <ScrollArea className="h-full overflow-hidden p-4">
        <div className="flex flex-col gap-4">
          {/* Compact Workspace Summary & Timezone Card */}
          <Card>
            <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div className="flex items-center gap-3.5">
                <div className="bg-primary text-primary-foreground flex h-10 w-10 shrink-0 items-center justify-center rounded-lg text-sm font-bold">
                  {getWorkspaceInitials(name)}
                </div>
                <div className="flex flex-col gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-base font-semibold">{name}</span>
                    <Badge variant="secondary">
                      {currentRoleLabelMap[role] ?? role}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-muted-foreground">
                      {t('Workspace ID')}:
                    </span>
                    <Typography.Text
                      code={true}
                      copyable={true}
                      className="font-mono text-xs"
                    >
                      {workspaceId}
                    </Typography.Text>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2.5">
                <span className="text-muted-foreground text-sm">
                  {t('Timezone')}
                </span>
                <Select
                  value={settings['timezone'] ?? 'utc'}
                  onValueChange={(value) =>
                    handleUpdateSettings('timezone', value)
                  }
                >
                  <SelectTrigger className="w-[240px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {timezoneList.map((item) => (
                      <SelectItem key={item.value} value={item.value}>
                        {item.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Segmented Dual-Mode Add Member Card */}
          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(handleInvite)}
              className={cn(!hasAdminPermission && 'opacity-50')}
            >
              <Card>
                <CardHeader className="border-b pb-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <CardTitle className="text-base">
                          {t('Add workspace member')}
                        </CardTitle>
                        {isUserIdMode && (
                          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-xs font-medium text-emerald-700 dark:border-emerald-900 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <LuZap className="h-3 w-3" aria-hidden="true" />
                            <span>{t('Instant · No SMTP needed')}</span>
                          </span>
                        )}
                        {!isUserIdMode && !globalConfig.smtpAvailable && (
                          <SimpleTooltip content={smtpUnavailableMessage}>
                            <span
                              role="img"
                              aria-label={smtpUnavailableMessage}
                              tabIndex={0}
                              className="inline-flex cursor-help"
                            >
                              <LuTriangleAlert
                                aria-hidden="true"
                                className="h-4 w-4 text-yellow-500"
                              />
                            </span>
                          </SimpleTooltip>
                        )}
                      </div>
                      <CardDescription>
                        {t(
                          'Add an existing user directly by User ID, or send an email invitation to a teammate.'
                        )}
                      </CardDescription>
                    </div>

                    <Tabs value={inviteMode} onValueChange={handleModeChange}>
                      <TabsList>
                        <TabsTrigger
                          value="userId"
                          className="gap-1.5"
                          disabled={!hasAdminPermission}
                        >
                          <LuIdCard className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t('By User ID')}</span>
                        </TabsTrigger>
                        <TabsTrigger
                          value="email"
                          className="gap-1.5"
                          disabled={!hasAdminPermission}
                        >
                          <LuMail className="h-3.5 w-3.5" aria-hidden="true" />
                          <span>{t('By Email')}</span>
                        </TabsTrigger>
                      </TabsList>
                    </Tabs>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-5">
                  {!isUserIdMode && !globalConfig.smtpAvailable && (
                    <div
                      role="alert"
                      className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-sm text-amber-900 dark:border-amber-900/70 dark:bg-amber-950/40 dark:text-amber-200"
                    >
                      <LuTriangleAlert
                        aria-hidden="true"
                        className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400"
                      />
                      <div className="space-y-0.5">
                        <div className="font-medium">
                          {t('SMTP is not configured on this server')}
                        </div>
                        <div className="text-xs text-amber-800 dark:text-amber-300/90">
                          {t(
                            'Existing accounts with a matching email will still join immediately, but invitation emails cannot be sent to unregistered addresses. Use "By User ID" for password-registered accounts.'
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-1 items-start gap-3 lg:grid-cols-[minmax(0,1fr)_180px_auto]">
                    <FormField
                      control={form.control}
                      name="emailOrId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            {isUserIdMode ? t('User ID') : t('Email Address')}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={
                                isUserIdMode
                                  ? t('Enter user ID (e.g. cm4x9k2p...)')
                                  : 'jane@example.com'
                              }
                              className={cn(isUserIdMode && 'font-mono')}
                              disabled={!hasAdminPermission}
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="role"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>{t('Role')}</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                            disabled={!hasAdminPermission}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value={ROLES.readOnly}>
                                {t('Read Only')}
                              </SelectItem>
                              <SelectItem value={ROLES.write}>
                                {t('Write')}
                              </SelectItem>
                              {isWorkspaceOwner && (
                                <SelectItem value={ROLES.admin}>
                                  {t('Admin')}
                                </SelectItem>
                              )}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="space-y-2">
                      <div
                        className="hidden h-[22px] lg:block"
                        aria-hidden="true"
                      />
                      <Button
                        type="submit"
                        loading={isInviteLoading}
                        disabled={!hasAdminPermission}
                        Icon={LuUserPlus}
                        className="whitespace-nowrap"
                      >
                        {isUserIdMode ? t('Add Member') : t('Send Invite')}
                      </Button>
                    </div>
                  </div>

                  {/* Role capability + User ID location helper strip */}
                  <div className="bg-muted/40 text-muted-foreground flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5 text-xs">
                    <div className="flex items-center gap-2">
                      <LuInfo
                        className="h-3.5 w-3.5 shrink-0"
                        aria-hidden="true"
                      />
                      <span>{roleDescriptionMap[selectedRole]}</span>
                    </div>

                    {isUserIdMode && (
                      <div className="flex items-center gap-1.5">
                        <span>{t('Where to find it:')}</span>
                        <Link
                          to="/settings/profile"
                          className="bg-background text-foreground hover:bg-accent rounded border px-2 py-0.5 font-medium transition-colors"
                        >
                          {t('Settings → Profile → User ID')}
                        </Link>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </form>
          </Form>

          {/* Members Card */}
          <Card>
            <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2 space-y-0 pb-4">
              <div className="flex items-center gap-2">
                <CardTitle className="text-base">{t('Members')}</CardTitle>
                <Badge variant="secondary">
                  {t('{{num}} members', { num: memberCount })}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>{workspaceMembersTable}</CardContent>
          </Card>

          {role === ROLES.owner && (
            <Card>
              <CardHeader className="text-lg font-bold">
                {t('Danger Zone')}
              </CardHeader>
              <CardContent>
                <div>
                  <div className="flex items-center gap-2 text-left">
                    <Input
                      className="w-60"
                      placeholder={t('New Workspace Name')}
                      value={renameWorkspaceName}
                      onChange={(e) => setRenameWorkspaceName(e.target.value)}
                    />

                    <AlertConfirm
                      title={'Confirm to rename this workspace?'}
                      description={`${name} => ${renameWorkspaceName}`}
                      onConfirm={handleRename}
                    >
                      <Button
                        type="button"
                        loading={isRenameLoading}
                        disabled={
                          !renameWorkspaceName || name === renameWorkspaceName
                        }
                      >
                        {t('Rename')}
                      </Button>
                    </AlertConfirm>
                  </div>

                  <Separator className="my-4" />

                  {isWorkspaceOwner && (
                    <div>
                      <div className="text-muted-foreground mb-2 text-sm">
                        {t(
                          'Manually check workspace usage and update pause status based on current limits'
                        )}
                      </div>
                      <Button
                        type="button"
                        loading={recheckPauseStatusMutation.isPending}
                        onClick={async () => {
                          await recheckPauseStatusMutation.mutateAsync({
                            workspaceId,
                          });
                          toast.success(
                            t(
                              'Recheck Pause Status Success, please reload window.'
                            )
                          );
                        }}
                      >
                        {t('Recheck Pause Status')}
                      </Button>
                    </div>
                  )}

                  <Separator className="my-4" />

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
                      loading={deleteWorkspaceMutation.isPending}
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
