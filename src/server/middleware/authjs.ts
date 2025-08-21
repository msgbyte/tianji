import type { Handler } from 'express';
import { getSession } from '@auth/express';
import { authConfig } from '../model/auth.js';
import { verifyUserApiKey } from '../model/user.js';
import { jwtVerify } from './auth.js';
import { SYSTEM_ROLES } from '@tianji/shared';
import { INIT_ADMIN_USER_ID } from '../utils/const.js';

export function auth(): Handler {
  return async (req, res, next) => {
    try {
      const authorization = (req.headers['authorization'] as string) ?? '';
      const token = authorization.replace('Bearer ', '');

      if (token) {
        if (token.startsWith('sk_')) {
          const user = await verifyUserApiKey(token);
          req.user = {
            id: user.id,
            username: user.username,
            role: user.role,
          };
          return next();
        }

        try {
          const payload = jwtVerify(token);
          req.user = payload;
          return next();
        } catch (err) {
          return res.status(401).json({ message: 'TokenInvalid' });
        }
      }

      const session = await getSession(req, authConfig);
      if (session) {
        const userId = session.user.id;
        req.user = {
          id: userId,
          username: session.user.name,
          role:
            userId === INIT_ADMIN_USER_ID
              ? SYSTEM_ROLES.admin
              : SYSTEM_ROLES.user,
        };
        return next();
      }

      return res.status(401).json({ message: 'No Token or Session' });
    } catch (err: any) {
      return res.status(500).json({ message: err?.message ?? 'Auth Failed' });
    }
  };
}
