import { useTranslation } from '@i18next-toolkit/react';
import { useCurrentWorkspace, useUserInfo } from '../../store/user';
import {
  AppRouterOutput,
  defaultErrorHandler,
  defaultSuccessHandler,
  trpc,
} from '@/api/trpc';
import { createColumnHelper, DataTable } from '@/components/DataTable';
import { useMemo, useState } from 'react';
import { LuPencil } from 'react-icons/lu';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { get } from 'lodash-es';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useEventWithLoading } from '@/hooks/useEvent';
import { ROLES } from '@tianji/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Typography } from 'antd';
import { cn } from '@/utils/style';

type MemberInfo = AppRouterOutput['workspace']['members'][number];
const columnHelper = createColumnHelper<MemberInfo>();

const roleBadgeStyles: Record<ROLES, string> = {
  [ROLES.owner]:
    'border-zinc-300 bg-zinc-100 text-zinc-900 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100',
  [ROLES.admin]:
    'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900 dark:bg-blue-950/60 dark:text-blue-300',
  [ROLES.write]:
    'border-teal-200 bg-teal-50 text-teal-700 dark:border-teal-900 dark:bg-teal-950/60 dark:text-teal-300',
  [ROLES.readOnly]:
    'border-zinc-200 bg-zinc-50 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-300',
};

function getMemberInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return '?';
  }
  const parts = trimmed.split(/\s+/);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ''}${parts[1][0] ?? ''}`.toUpperCase();
  }
  return trimmed.slice(0, 2).toUpperCase();
}

function formatShortUserId(id: string): string {
  if (id.length <= 14) {
    return id;
  }
  return `${id.slice(0, 8)}…${id.slice(-4)}`;
}

export function useWorkspaceMembers() {
  const { t } = useTranslation();
  const { id: workspaceId, role } = useCurrentWorkspace();
  const [editMember, setEditMember] = useState<MemberInfo | null>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const userId = useUserInfo()?.id;
  const { data: members = [], refetch: refetchMembers } =
    trpc.workspace.members.useQuery(
      {
        workspaceId,
      },
      {
        select: (data) => {
          return [...data].sort((a, b) => {
            // Display current user first
            if (a.userId === userId) {
              return -1;
            }
            if (b.userId === userId) {
              return 1;
            }

            // Sort by creation time
            return (
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
            );
          });
        },
      }
    );

  const memberRoleTranslation = useMemo(
    () => ({
      [ROLES.owner]: t('Owner'),
      [ROLES.admin]: t('Admin'),
      [ROLES.write]: t('Write'),
      [ROLES.readOnly]: t('Read Only'),
    }),
    [t]
  );

  const updateRoleMutation = trpc.workspace.updateMemberRole.useMutation({
    onSuccess: defaultSuccessHandler,
    onError: defaultErrorHandler,
  });

  const [handleUpdateRole, isUpdateRoleLoading] = useEventWithLoading(
    async () => {
      if (!editMember || !selectedRole) {
        return;
      }

      await updateRoleMutation.mutateAsync({
        workspaceId,
        userId: editMember.userId,
        role: selectedRole as ROLES,
      });

      setEditMember(null);
      refetchMembers();
    }
  );

  const columns = useMemo(() => {
    return [
      columnHelper.accessor(
        (data) =>
          get(data, ['user', 'nickname']) || get(data, ['user', 'username']),
        {
          id: 'member',
          header: t('Member'),
          size: 195,
          cell: (props) => {
            const { user, userId: memberUserId } = props.row.original;
            const displayName = user.nickname || user.username;
            const showUsernameSub =
              Boolean(user.nickname) && user.nickname !== user.username;
            const isCurrentUser = memberUserId === userId;

            return (
              <div className="flex items-center gap-2.5">
                <Avatar size="sm" className="border">
                  {user.avatar && (
                    <AvatarImage src={user.avatar} alt={displayName} />
                  )}
                  <AvatarFallback
                    delayMs={0}
                    className="text-xs font-semibold"
                  >
                    {getMemberInitials(displayName)}
                  </AvatarFallback>
                </Avatar>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="truncate font-medium">{displayName}</span>
                    {isCurrentUser && (
                      <Badge
                        variant="secondary"
                        className="px-1.5 py-0 text-[10px]"
                      >
                        {t('You')}
                      </Badge>
                    )}
                  </div>
                  {showUsernameSub && (
                    <div className="text-muted-foreground truncate text-xs">
                      @{user.username}
                    </div>
                  )}
                </div>
              </div>
            );
          },
        }
      ),
      columnHelper.accessor('user.email', {
        header: t('Email'),
        size: 195,
        cell: (props) => {
          const email = props.getValue();

          let emailEl: React.ReactNode = (
            <span className="truncate">{email}</span>
          );
          if (email === null) {
            emailEl = (
              <span className="text-muted-foreground">{t('(None)')}</span>
            );
          } else if (String(email).endsWith('@auth.tianji.com')) {
            emailEl = (
              <span className="text-muted-foreground">{t('(Internal)')}</span>
            );
          }

          return (
            <div className="flex items-center gap-1.5">
              {emailEl}
              {props.row.original.user.emailVerified && (
                <Badge
                  variant="secondary"
                  className="shrink-0 px-1.5 py-0 text-[11px]"
                >
                  {t('Verified')}
                </Badge>
              )}
            </div>
          );
        },
      }),
      columnHelper.accessor('userId', {
        header: t('User ID'),
        size: 165,
        cell: (props) => {
          const fullUserId = props.getValue();

          return (
            <Typography.Text
              code={true}
              copyable={{ text: fullUserId }}
              title={fullUserId}
              className="whitespace-nowrap font-mono text-xs"
            >
              {formatShortUserId(fullUserId)}
            </Typography.Text>
          );
        },
      }),
      columnHelper.accessor('role', {
        header: t('Role'),
        size: 135,
        cell: (props) => {
          const memberRole = props.getValue() as ROLES;

          return (
            <div className="flex items-center gap-1.5 whitespace-nowrap">
              <span
                className={cn(
                  'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-semibold',
                  roleBadgeStyles[memberRole] ?? roleBadgeStyles[ROLES.readOnly]
                )}
              >
                {memberRoleTranslation[memberRole] ?? memberRole}
              </span>
              {role === ROLES.owner &&
                props.row.original.role !== ROLES.owner &&
                props.row.original.userId !== userId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 shrink-0"
                    aria-label={t('Update Member Role')}
                    onClick={() => {
                      setEditMember(props.row.original);
                      setSelectedRole(props.row.original.role);
                    }}
                  >
                    <LuPencil className="h-3 w-3" />
                  </Button>
                )}
            </div>
          );
        },
      }),
    ];
  }, [t, role, userId, memberRoleTranslation]);

  const tableEl = (
    <>
      <DataTable columns={columns} data={members} />
      <Dialog
        open={!!editMember}
        onOpenChange={(open) => !open && setEditMember(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('Update Member Role')}</DialogTitle>
          </DialogHeader>

          <div className="py-4">
            <div className="mb-4">
              <div className="mb-2">{t('Member')}:</div>
              <div className="font-semibold">
                {editMember?.user.nickname || editMember?.user.username}
              </div>
            </div>

            <div>
              <div className="mb-2">{t('Role')}:</div>
              <Select
                value={selectedRole || editMember?.role || ''}
                onValueChange={setSelectedRole}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ROLES.admin}>
                    {memberRoleTranslation[ROLES.admin]}
                  </SelectItem>
                  <SelectItem value={ROLES.write}>
                    {memberRoleTranslation[ROLES.write]}
                  </SelectItem>
                  <SelectItem value={ROLES.readOnly}>
                    {memberRoleTranslation[ROLES.readOnly]}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditMember(null)}>
              {t('Cancel')}
            </Button>
            <Button onClick={handleUpdateRole} loading={isUpdateRoleLoading}>
              {t('Save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return { tableEl, memberCount: members.length };
}
