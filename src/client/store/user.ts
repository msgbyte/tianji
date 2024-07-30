import { create } from 'zustand';
import { createSocketIOClient } from '../api/socketio';
import { AppRouterOutput } from '../api/trpc';

type UserLoginInfo = NonNullable<AppRouterOutput['user']['info']>;

interface UserState {
  info: UserLoginInfo | null;
}

export const useUserStore = create<UserState>(() => ({
  info: null,
}));

export function setUserInfo(info: UserLoginInfo) {
  if (!info.currentWorkspace && info.workspaces[0]) {
    // Make sure currentWorkspace existed
    info.currentWorkspace = {
      ...info.workspaces[0].workspace,
    };
  }

  useUserStore.setState({
    info,
  });

  // create socketio after login
  if (info.currentWorkspace) {
    createSocketIOClient(info.currentWorkspace.id);
  }
}

export function useUserInfo(): UserLoginInfo | null {
  return useUserStore((state) => state.info);
}

export function useIsLogined() {
  return !!useUserInfo();
}

export function useCurrentWorkspace() {
  const currentWorkspace = useUserStore(
    (state) => state.info?.currentWorkspace
  );

  if (!currentWorkspace) {
    throw new Error('No Workspace Id');
  }

  return currentWorkspace;
}

export function useCurrentWorkspaceId() {
  const currentWorkspaceId = useUserStore(
    (state) => state.info?.currentWorkspace?.id
  );

  if (!currentWorkspaceId) {
    throw new Error('No Workspace Id');
  }

  return currentWorkspaceId;
}
