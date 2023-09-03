import { create } from 'zustand';

export interface UserLoginInfo {
  id: string;
  username: string;
  role: string;
  currentWorkspace: {
    id: string;
    name: string;
  };
  workspaces: {
    role: string;
    workspace: {
      id: string;
      name: string;
    };
  }[];
}

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
}
