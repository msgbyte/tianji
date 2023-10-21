import { initTRPC, inferAsyncReturnType, TRPCError } from '@trpc/server';
import _ from 'lodash';
import { z } from 'zod';
import { jwtVerify } from '../middleware/auth';
import { getWorkspaceUser } from '../model/workspace';
import { ROLES, SYSTEM_ROLES } from '../utils/const';
import type { IncomingMessage } from 'http';
import { OpenApiMeta } from 'trpc-openapi';

export function createContext({ req }: { req: IncomingMessage }) {
  const authorization = req.headers['authorization'] ?? '';
  const token = authorization.replace('Bearer ', '');

  return { token };
}

type Context = inferAsyncReturnType<typeof createContext>;
const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export const middleware = t.middleware;
export const router = t.router;
export const publicProcedure = t.procedure;

const isUser = middleware(async (opts) => {
  const token = opts.ctx.token;

  if (!token) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'NoToken' });
  }

  try {
    const user = jwtVerify(token);

    return opts.next({
      ctx: {
        user,
      },
    });
  } catch (err) {
    throw new TRPCError({ code: 'UNAUTHORIZED', message: 'TokenInvalid' });
  }
});

export const protectProedure = t.procedure.use(isUser);

const isSystemAdmin = isUser.unstable_pipe(async (opts) => {
  const { ctx, input } = opts;

  if (ctx.user.role !== SYSTEM_ROLES.admin) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return opts.next();
});

export const systemAdminProcedure = t.procedure.use(isSystemAdmin);
export const workspaceProcedure = protectProedure
  .input(
    z.object({
      workspaceId: z.string().cuid2(),
    })
  )
  .use(createWorkspacePermissionMiddleware());
export const workspaceOwnerProcedure = protectProedure
  .input(
    z.object({
      workspaceId: z.string().cuid2(),
    })
  )
  .use(createWorkspacePermissionMiddleware([ROLES.owner]));

/**
 * Create a trpc middleware which help user check workspace permission
 */
function createWorkspacePermissionMiddleware(roles: ROLES[] = []) {
  return isUser.unstable_pipe(async (opts) => {
    const { ctx, input } = opts;

    const workspaceId = _.get(input, 'workspaceId', '');
    if (!workspaceId) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Payload required workspaceId',
      });
    }

    const userId = ctx.user.id;

    if (!userId) {
      throw new TRPCError({
        code: 'INTERNAL_SERVER_ERROR',
        message: 'ctx miss userId',
      });
    }

    const info = await getWorkspaceUser(workspaceId, userId);
    if (!info) {
      throw new TRPCError({
        code: 'FORBIDDEN',
        message: 'Is not workspace user',
      });
    }

    if (Array.isArray(roles) && roles.length > 0) {
      if (!roles.includes(info.role as ROLES)) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: `Workspace roles not has this permission, need ${roles}`,
        });
      }
    }

    return opts.next();
  });
}
