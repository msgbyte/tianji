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
import { useEventWithLoading } from '@/hooks/useEvent';
import { ROLES } from '@tianji/shared';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

type MemberInfo = AppRouterOutput['workspace']['members'][number];
const columnHelper = createColumnHelper<MemberInfo>();

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

  const memberRoleTranslation = {
    [ROLES.owner]: t('Owner'),
    [ROLES.admin]: t('Admin'),
    [ROLES.readOnly]: t('Read Only'),
  };

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
          header: t('Name'),
          size: 300,
        }
      ),
      columnHelper.accessor('user.email', {
        header: t('Email'),
        size: 130,
        cell: (props) => {
          const email = props.getValue();

          let emailEl: React.ReactNode = <span>{email}</span>;
          if (email === null) {
            emailEl = <span className="text-gray-500">(null)</span>;
          } else if (String(email).endsWith('@auth.tianji.com')) {
            emailEl = <span className="text-gray-500">{t('(Internal)')}</span>;
          }

          return (
            <span>
              {emailEl}
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
        cell: (props) => {
          const memberRole = props.getValue() as ROLES;

          return (
            <div className="flex items-center gap-2">
              <span>{memberRoleTranslation[memberRole]}</span>
              {role === ROLES.owner &&
                props.row.original.role !== ROLES.owner &&
                props.row.original.userId !== userId && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6"
                    onClick={() => setEditMember(props.row.original)}
                  >
                    <LuPencil className="h-3 w-3" />
                  </Button>
                )}
            </div>
          );
        },
      }),
    ];
  }, [t, role]);

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

  return { tableEl };
}
