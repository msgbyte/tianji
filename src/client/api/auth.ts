const TOKEN_STORAGE_KEY = 'jsonwebtoken';

export function getJWT(): string | null {
  const token = window.localStorage.getItem(TOKEN_STORAGE_KEY);

  return token ?? null;
}

export function setJWT(jwt: string) {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, jwt);
}
