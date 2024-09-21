import { initTRPC, inferAsyncReturnType, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { jwtVerify } from '../middleware/auth.js';
import { getWorkspaceUser } from '../model/workspace.js';
import { ROLES, SYSTEM_ROLES } from '@tianji/shared';
import type { Request } from 'express';
import { OpenApiMeta } from 'trpc-openapi';
import { getSession } from '@auth/express';
import { authConfig } from '../model/auth.js';
import { get } from 'lodash-es';

export async function createContext({ req }: { req: Request }) {
  const authorization = req.headers['authorization'] ?? '';
  const token = authorization.replace('Bearer ', '');

  return { token, req };
}

type Context = inferAsyncReturnType<typeof createContext>;
const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export type OpenApiMetaInfo = NonNullable<OpenApiMeta['openapi']>;

export const middleware = t.middleware;
export const router = t.router;
export const publicProcedure = t.procedure;

const isUser = middleware(async (opts) => {
  // auth with token
  const token = opts.ctx.token;

  if (token) {
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
  }

  // auth with session
  const req = opts.ctx.req;
  const session = await getSession(req, authConfig);

  if (session) {
    return opts.next({
      ctx: {
        user: {
          id: session.user?.id,
          username: session.user?.name,
          role: SYSTEM_ROLES.user,
        },
      },
    });
  }

  throw new TRPCError({ code: 'UNAUTHORIZED', message: 'No Token or Session' });
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

export const workspaceAdminProcedure = protectProedure
  .input(
    z.object({
      workspaceId: z.string().cuid2(),
    })
  )
  .use(createWorkspacePermissionMiddleware([ROLES.owner, ROLES.admin]));

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

    const workspaceId = get(input, 'workspaceId', '');
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
