import jwt from 'jsonwebtoken';
import { jwtSecret } from '../utils/common.js';

export const jwtIssuer = process.env.JWT_ISSUER || 'tianji.msgbyte.com';
export const jwtAudience = process.env.JWT_AUDIENCE || 'msgbyte.com';

export interface JWTPayload {
  id: string;
  username: string;
  role: string;
}

export function jwtSign(payload: JWTPayload): string {
  const token = jwt.sign(
    {
      id: payload.id,
      username: payload.username,
      role: payload.role,
    },
    jwtSecret,
    {
      issuer: jwtIssuer,
      audience: jwtAudience,
      expiresIn: '30d',
    }
  );

  return token;
}

export function jwtVerify(token: string): JWTPayload {
  const payload = jwt.verify(token, jwtSecret, {
    issuer: jwtIssuer,
    audience: jwtAudience,
  });

  return payload as JWTPayload;
}
