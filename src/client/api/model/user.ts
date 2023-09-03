import { setUserInfo, UserLoginInfo } from '../../store/user';
import { getJWT, setJWT } from '../auth';
import { request } from '../request';

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
