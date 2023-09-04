import { setUserInfo } from '../../store/user';
import { getJWT, setJWT } from '../auth';
import { request } from '../request';

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

export async function login(username: string, password: string) {
  const { data } = await request.post('/api/user/login', {
    username,
    password,
  });

  setJWT(data.token);
  setUserInfo(data.info as UserLoginInfo);
}

export async function loginWithToken() {
  const { data } = await request.post('/api/user/loginWithToken', {
    token: getJWT(),
  });

  setJWT(data.token);
  setUserInfo(data.info as UserLoginInfo);
}

export async function register(username: string, password: string) {
  const { data } = await request.post('/api/user/register', {
    username,
    password,
  });

  setJWT(data.token);
  setUserInfo(data.info as UserLoginInfo);
}
