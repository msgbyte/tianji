import { ROLES } from '@tianji/shared';
import { trpc } from '../../../api/trpc';
import { useUserInfo } from '../../../store/user';

export function useAllowEdit(workspaceId?: string): boolean {
  const userInfo = useUserInfo();

  const { data: role } = trpc.workspace.getUserWorkspaceRole.useQuery(
    {
      workspaceId: workspaceId!,
      userId: userInfo?.id!,
    },
    {
      enabled: !!userInfo?.id && !!workspaceId,
    }
  );

  return role === ROLES.owner;
}
