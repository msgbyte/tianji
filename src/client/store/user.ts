import { create } from 'zustand';
import { UserLoginInfo } from '../api/model/user';
import { createSocketIOClient } from '../api/socketio';

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
      id: info.workspaces[0].workspace.id,
      name: info.workspaces[0].workspace.name,
    };
  }

  useUserStore.setState({
    info,
  });

  // create socketio after login
  createSocketIOClient(info.currentWorkspace.id);
}

export function useCurrentWorkspaceId() {
  const currentWorkspaceId = useUserStore(
    (state) => state.info?.currentWorkspace?.id
  );

  return currentWorkspaceId;
}
