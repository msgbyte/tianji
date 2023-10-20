import { protectProedure, publicProcedure, router } from '../trpc';
import { z } from 'zod';
import {
  authUser,
  authUserWithToken,
  changeUserPassword,
  createAdminUser,
  createUser,
  getUserCount,
} from '../../model/user';
import { jwtSign } from '../../middleware/auth';
import { TRPCError } from '@trpc/server';

export const userRouter = router({
  login: publicProcedure
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { username, password } = input;
      const user = await authUser(username, password);

      const token = jwtSign(user);

      return { info: user, token };
    }),
  loginWithToken: publicProcedure
    .input(
      z.object({
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
    .input(
      z.object({
        username: z.string(),
        password: z.string(),
      })
    )
    .mutation(async ({ input }) => {
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
});
