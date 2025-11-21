import { shallow } from 'zustand/shallow';
import { createWithEqualityFn } from 'zustand/traditional';
import { createSocketIOClient } from '../api/socketio';
import { AppRouterOutput } from '../api/trpc';
import { ROLES } from '@tianji/shared';
import { immer } from 'zustand/middleware/immer';

export type UserLoginInfo = NonNullable<AppRouterOutput['user']['info']>;

interface UserState {
  info: UserLoginInfo | null;
  updateCurrentWorkspaceName: (name: string) => void;
  updateCurrentWorkspaceSettings: (settings: Record<string, any>) => void;
}

export const useUserStore = createWithEqualityFn<UserState>()(
  immer((set) => ({
    info: null,
    updateCurrentWorkspaceName: (name) => {
      const currentUserInfo = useUserStore.getState().info;
      if (!currentUserInfo) {
        return;
      }

      set((state) => {
        for (const workspace of state.info?.workspaces ?? []) {
          workspace.workspace.name = name;
        }
      });
    },
    updateCurrentWorkspaceSettings: (settings) => {
      set((state) => {
        const currentUserInfo = useUserStore.getState().info;
        if (!currentUserInfo) {
          return;
        }

        for (const workspace of state.info?.workspaces ?? []) {
          workspace.workspace.settings = {
            ...workspace.workspace.settings,
            ...settings,
          };
        }
      });
    },
  })),
  shallow
);

export function setUserInfo(info: UserLoginInfo) {
  useUserStore.setState({
    info,
  });

  // create socketio after login
  if (info.currentWorkspaceId) {
    createSocketIOClient(info.currentWorkspaceId);
  }
}

export function useUserInfo(): UserLoginInfo | null {
  return useUserStore((state) => state.info);
}

export function useIsLogined() {
  return !!useUserInfo();
}

export function changeUserCurrentWorkspace(currentWorkspaceId: string) {
  const currentUserInfo = useUserStore.getState().info;
  if (!currentUserInfo) {
    return;
  }

  useUserStore.setState({
    info: {
      ...currentUserInfo,
      currentWorkspaceId,
    },
  });
  createSocketIOClient(currentWorkspaceId);
}

export function useCurrentWorkspaceSafe() {
  const currentWorkspace = useUserStore((state) => {
    if (!state.info) {
      return null;
    }

    const currentWorkspaceId = state.info.currentWorkspaceId;
    if (!currentWorkspaceId) {
      return null;
    }

    const currentWorkspace = state.info?.workspaces.find(
      (w) => w.workspace.id === currentWorkspaceId
    );

    if (!currentWorkspace) {
      return null;
    }

    return {
      id: currentWorkspace.workspace.id,
      name: currentWorkspace.workspace.name,
      role: currentWorkspace.role,
      settings: currentWorkspace.workspace.settings,
      paused: currentWorkspace.workspace.paused,
    };
  });

  return currentWorkspace;
}

/**
 * Direct return current workspace info
 * NOTICE: its will throw error if no workspace id
 */
export function useCurrentWorkspace() {
  const currentWorkspace = useCurrentWorkspaceSafe();

  if (!currentWorkspace) {
    throw new Error('No Workspace Id');
  }

  return currentWorkspace;
}

/**
 * Direct return current workspace id
 * NOTICE: its will throw error if no workspace id
 */
export function useCurrentWorkspaceId() {
  const currentWorkspaceId = useUserStore(
    (state) => state.info?.currentWorkspaceId
  );

  if (!currentWorkspaceId) {
    throw new Error('No Workspace Id');
  }

  return currentWorkspaceId;
}

/**
 * Direct return current workspace role
 */
export function useCurrentWorkspaceRole(): ROLES {
  const workspace = useCurrentWorkspace();

  return (workspace.role as ROLES) || ROLES.readOnly;
}

export function useHasPermission(role: ROLES): boolean {
  const currentWorkspaceRole = useCurrentWorkspaceRole();

  if (currentWorkspaceRole === ROLES.owner) {
    return true;
  }

  if (currentWorkspaceRole === ROLES.admin && role !== ROLES.owner) {
    return true;
  }

  if (currentWorkspaceRole === ROLES.readOnly && role === ROLES.readOnly) {
    return true;
  }

  return false;
}

export function useHasAdminPermission(): boolean {
  const hasAdminPermission = useHasPermission(ROLES.admin);

  return hasAdminPermission;
}

export function useIsWorkspaceOwner(): boolean {
  const currentWorkspaceRole = useCurrentWorkspaceRole();

  return currentWorkspaceRole === ROLES.owner;
}

export function useWorkspacePaused(): boolean {
  const currentWorkspace = useCurrentWorkspace();

  return currentWorkspace.paused || false;
}
