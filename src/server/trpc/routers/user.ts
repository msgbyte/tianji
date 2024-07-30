import { protectProedure, publicProcedure, router } from '../trpc.js';
import { z } from 'zod';
import {
  authUser,
  authUserWithToken,
  changeUserPassword,
  createAdminUser,
  createUser,
  getUserCount,
  getUserInfo,
} from '../../model/user.js';
import { jwtSign } from '../../middleware/auth.js';
import { TRPCError } from '@trpc/server';
import { env } from '../../utils/env.js';
import { userInfoSchema } from '../../model/_schema/index.js';
import { OPENAPI_TAG } from '../../utils/const.js';

export const userRouter = router({
  login: publicProcedure
    .meta({
      openapi: { method: 'POST', path: '/login', tags: [OPENAPI_TAG.USER] },
    })
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .output(
      z.object({
        info: userInfoSchema,
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { username, password } = input;
      const user = await authUser(username, password);

      const token = jwtSign(user);

      return { info: user, token };
    }),
  loginWithToken: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/loginWithToken',
        tags: [OPENAPI_TAG.USER],
      },
    })
    .input(
      z.object({
        token: z.string(),
      })
    )
    .output(
      z.object({
        info: userInfoSchema,
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { token } = input;

      if (!token) {
        throw new Error('Cannot get token');
      }

      try {
        const user = await authUserWithToken(token);

        const newToken = jwtSign(user);

        return { info: user, token: newToken };
      } catch (err) {
        throw new TRPCError({ code: 'FORBIDDEN', message: 'Invalid token' });
      }
    }),
  register: publicProcedure
    .meta({
      openapi: {
        enabled: env.allowRegister,
        method: 'POST',
        path: '/register',
        tags: [OPENAPI_TAG.USER],
      },
    })
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .output(
      z.object({
        info: userInfoSchema,
        token: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      if (!env.allowRegister) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'Not allow register',
        });
      }

      const { username, password } = input;

      const userCount = await getUserCount();
      if (userCount === 0) {
        const user = await createAdminUser(username, password);

        const token = jwtSign(user);

        return { info: user, token };
      } else {
        const user = await createUser(username, password);

        const token = jwtSign(user);

        return { info: user, token };
      }
    }),
  changePassword: protectProedure
    .input(
      z.object({
        oldPassword: z.string(),
        newPassword: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const userId = ctx.user.id;
      const { oldPassword, newPassword } = input;

      return changeUserPassword(userId, oldPassword, newPassword);
    }),
  info: protectProedure
    .input(z.void())
    .output(userInfoSchema.nullable())
    .query(async ({ input, ctx }) => {
      return getUserInfo(ctx.user.id);
    }),
});
