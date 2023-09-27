import { initTRPC, inferAsyncReturnType, TRPCError } from '@trpc/server';
import * as trpcExpress from '@trpc/server/adapters/express';
import _ from 'lodash';
import { z } from 'zod';
import { jwtVerify } from '../middleware/auth';
import { getWorkspaceUser } from '../model/workspace';
import { ROLES, SYSTEM_ROLES } from '../utils/const';

export function createContext({
  req,
  res,
}: trpcExpress.CreateExpressContextOptions) {
  const authorization = req.headers['authorization'] ?? '';
  const token = authorization.replace('Bearer ', '');

  try {
    const user = jwtVerify(token);

    return { user };
  } catch (err) {
    throw new TRPCError({ code: 'UNAUTHORIZED' });
  }
}

type Context = inferAsyncReturnType<typeof createContext>;
const t = initTRPC.context<Context>().create();

export const middleware = t.middleware;
export const router = t.router;
export const publicProcedure = t.procedure;

const isSystemAdmin = middleware(async (opts) => {
  const { ctx, input } = opts;
  if (ctx.user.role !== SYSTEM_ROLES.admin) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return opts.next();
});

export const systemAdminProcedure = t.procedure.use(isSystemAdmin);
export const workspaceProcedure = t.procedure
  .input(
    z.object({
      workspaceId: z.string().uuid(),
    })
  )
  .use(createWorkspacePermissionMiddleware());
export const workspaceOwnerProcedure = t.procedure
  .input(
    z.object({
      workspaceId: z.string().uuid(),
    })
  )
  .use(createWorkspacePermissionMiddleware([ROLES.owner]));

/**
 * Create a trpc middleware which help user check workspace permission
 */
function createWorkspacePermissionMiddleware(roles: ROLES[] = []) {
  return middleware(async (opts) => {
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
