import axios from 'axios';

/**
 * @deprecated
 */
const TOKEN_STORAGE_KEY = 'jsonwebtoken';

/**
 * @deprecated
 */
export function getJWT(): string | null {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);

  return token ?? null;
}

/**
 * @deprecated
 */
export function setJWT(jwt: string) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, jwt);
}

/**
 * @deprecated
 */
export function clearJWT() {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

export async function getSession(): Promise<{
  user: {
    email?: string;
  };
  expires: string;
} | null> {
  const { data } = await axios.get('/api/auth/session');

  if (!data) {
    return null;
  }

  return data;
}
