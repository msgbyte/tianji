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

export function setUserInfo(info: UserInfo) {
  useUserStore.setState({
    info,
  });
}
