import { protectProedure, publicProcedure, router } from '../trpc.js';
import { z } from 'zod';
import {
  authUser,
  authUserWithToken,
  changeUserPassword,
  createAdminUser,
  createUser,
  generateUserApiKey,
  getUserCount,
  getUserInfo,
} from '../../model/user.js';
import { jwtSign } from '../../middleware/auth.js';
import { TRPCError } from '@trpc/server';
import { env } from '../../utils/env.js';
import { userInfoSchema } from '../../model/_schema/index.js';
import { OPENAPI_TAG } from '../../utils/const.js';
import { prisma } from '../../model/_client.js';
import { UserApiKeyModelSchema } from '../../prisma/zod/userapikey.js';

export const userRouter = router({
  login: publicProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/login',
        tags: [OPENAPI_TAG.USER],
        summary: 'User login',
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
        summary: 'Login with token',
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
        summary: 'Register user',
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
    .query(async ({ ctx }) => {
      return getUserInfo(ctx.user.id);
    }),
  allApiKeys: protectProedure
    .input(z.void())
    .output(UserApiKeyModelSchema.array())
    .query(async ({ ctx }) => {
      return prisma.userApiKey.findMany({
        where: {
          userId: ctx.user.id,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
    }),
  generateApiKey: protectProedure
    .input(z.void())
    .output(z.string())
    .mutation(async ({ ctx }) => {
      return generateUserApiKey(ctx.user.id);
    }),
  deleteApiKey: protectProedure
    .input(
      z.object({
        apiKey: z.string(),
      })
    )
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      await prisma.userApiKey.delete({
        where: {
          userId: ctx.user.id,
          apiKey: input.apiKey,
        },
      });
    }),
  updateApiKeyDescription: protectProedure
    .input(
      z.object({
        apiKey: z.string(),
        description: z.string().nullable(),
      })
    )
    .output(z.void())
    .mutation(async ({ input, ctx }) => {
      await prisma.userApiKey.update({
        where: {
          userId: ctx.user.id,
          apiKey: input.apiKey,
        },
        data: {
          description: input.description,
        },
      });
    }),
});
