import { findUser } from '../model/user';
import passport from 'passport';
import { Handler } from 'express';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import jwt from 'jsonwebtoken';
import { jwtSecret } from '../utils/common';

export const jwtIssuer = process.env.JWT_ISSUER || 'tianji.msgbyte.com';
export const jwtAudience = process.env.JWT_AUDIENCE || 'msgbyte.com';

export interface JWTPayload {
  id: string;
  username: string;
  role: string;
}

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
      issuer: jwtIssuer,
      audience: jwtAudience,
    },
    function (jwt_payload, done) {
      findUser(jwt_payload.id)
        .then((user) => {
          if (user) {
            done(null, user);
          } else {
            done(null, false);
          }
        })
        .catch((err) => {
          done(err);
        });
    }
  )
);

passport.serializeUser(function (user: any, cb) {
  cb(null, { id: user.id, username: user.username });
});

passport.deserializeUser(function (user: any, cb) {
  cb(null, user);
});

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

export function auth(): Handler {
  return passport.authenticate('jwt', {
    session: false,
  });
}
