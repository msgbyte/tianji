import { authUser, findUser } from '../model/user';
import passport from 'passport';
import { Handler } from 'express';
import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { nanoid } from 'nanoid';
import jwt from 'jsonwebtoken';

export const jwtSecret = process.env.JWT_SECRET || nanoid();
export const jwtIssuer = process.env.JWT_ISSUER || 'tianji.msgbyte.com';
export const jwtAudience = process.env.JWT_AUDIENCE || 'msgbyte.com';

passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
      issuer: jwtIssuer,
      audience: jwtAudience,
    },
    function (jwt_payload, done) {
      findUser(jwt_payload.sub)
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

export function jwtSign(payload: {}): string {
  const token = jwt.sign(payload, jwtSecret, {
    issuer: jwtIssuer,
    audience: jwtAudience,
    expiresIn: '30d',
  });

  return token;
}

export function auth(): Handler {
  return passport.authenticate('jwt', {
    session: false,
  });
}
