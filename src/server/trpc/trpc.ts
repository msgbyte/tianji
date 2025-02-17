import { initTRPC, TRPCError } from '@trpc/server';
import { z } from 'zod';
import { jwtVerify } from '../middleware/auth.js';
import { getWorkspaceUser } from '../model/workspace.js';
import { ROLES, SYSTEM_ROLES } from '@tianji/shared';
import { OpenApiMeta } from 'trpc-to-openapi';
import { getSession } from '@auth/express';
import { authConfig } from '../model/auth.js';
import { get } from 'lodash-es';
import { promTrpcRequest } from '../utils/prometheus/client.js';
import { verifyUserApiKey } from '../model/user.js';
import { CreateExpressContextOptions } from '@trpc/server/adapters/express';
import { parse as languageParse } from 'accept-language-parser';

export async function createContext({ req }: CreateExpressContextOptions) {
  const authorization = req.headers['authorization'] ?? '';
  const token = authorization.replace('Bearer ', '');
  const timezone = req.headers['timezone']
    ? String(req.headers['timezone'])
    : 'utc';
  const language =
    languageParse(req.headers['accept-language'])?.[0].code ?? 'en';

  return { token, timezone, language, req };
}

type Context = Awaited<ReturnType<typeof createContext>>;
const t = initTRPC.context<Context>().meta<OpenApiMeta>().create();

export type OpenApiMetaInfo = NonNullable<OpenApiMeta['openapi']>;

export const middleware = t.middleware;
export const router = t.router;

const prom = middleware(async (opts) => {
  const path = opts.path;
  const type = opts.type;

  const endRequest = promTrpcRequest.startTimer({
    route: path,
    type,
  });

  try {
    const res = await opts.next();

    endRequest({
      status: 'success',
    });
    return res;
  } catch (err) {
    endRequest({
      status: 'error',
    });

    throw err;
  }
});

export const publicProcedure = t.procedure.use(prom);

const isUser = middleware(async (opts) => {
  // auth with token
  const token = opts.ctx.token;

  if (token) {
    if (token.startsWith('sk_')) {
      // auth with api key
      const user = await verifyUserApiKey(token);

      return opts.next({
        ctx: {
          user: {
            id: user.id,
            username: user.username,
            role: user.role,
          },
        },
      });
    } else {
      // auth with jwt
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

export const protectProedure = t.procedure.use(prom).use(isUser);

const isSystemAdmin = isUser.unstable_pipe(async (opts) => {
  const { ctx, input } = opts;

  if (ctx.user.role !== SYSTEM_ROLES.admin) {
    throw new TRPCError({ code: 'FORBIDDEN' });
  }

  return opts.next();
});

export const systemAdminProcedure = t.procedure.use(prom).use(isSystemAdmin);
export const workspaceProcedure = publicProcedure
  .input(
    z.object({
      workspaceId: z.string().cuid2(),
    })
  )
  .use(createWorkspacePermissionMiddleware());

export const workspaceAdminProcedure = publicProcedure
  .input(
    z.object({
      workspaceId: z.string().cuid2(),
    })
  )
  .use(createWorkspacePermissionMiddleware([ROLES.owner, ROLES.admin]));

export const workspaceOwnerProcedure = publicProcedure
  .input(
    z.object({
      workspaceId: z.string().cuid2(),
    })
  )
  .use(createWorkspacePermissionMiddleware([ROLES.owner]));

/**
 * Create a trpc middleware which help user check workspace permission
 * NOTE: this middleware already include user auth, so we dont need use it under protectProedure which will trigger user auth twice.
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
