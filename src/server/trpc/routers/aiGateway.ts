import { z } from 'zod';
import {
  OpenApiMetaInfo,
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { OpenApiMeta } from 'trpc-to-openapi';
import { OPENAPI_TAG } from '../../utils/const.js';
import { AIGatewayModelSchema } from '../../prisma/zod/aigateway.js';
import { AIGatewayLogsModelSchema } from '../../prisma/zod/aigatewaylogs.js';
import { prisma } from '../../model/_client.js';
import { fetchDataByCursor } from '../../utils/prisma.js';
import { buildCursorResponseSchema } from '../../utils/schema.js';

const aiGatewayCreateSchema = z.object({
  name: z.string().max(100),
});

export const aiGatewayRouter = router({
  all: workspaceProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/workspace/{workspaceId}/aiGateway/all',
        tags: [OPENAPI_TAG.AI_GATEWAY],
        protect: true,
      },
    })
    .output(z.array(AIGatewayModelSchema))
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const aiGateways = await prisma.aIGateway.findMany({
        where: {
          workspaceId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return aiGateways;
    }),
  info: workspaceProcedure
    .meta(
      buildAIGatewayOpenapi({
        method: 'GET',
        path: '/info',
      })
    )
    .input(
      z.object({
        gatewayId: z.string(),
      })
    )
    .output(AIGatewayModelSchema.nullable())
    .query(async ({ input }) => {
      const { workspaceId, gatewayId } = input;

      const aiGateway = await prisma.aIGateway.findFirst({
        where: {
          workspaceId,
          id: gatewayId,
        },
      });

      return aiGateway;
    }),
  create: workspaceAdminProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/workspace/{workspaceId}/aiGateway/create',
        tags: [OPENAPI_TAG.APPLICATION],
        protect: true,
      },
    })
    .input(aiGatewayCreateSchema)
    .output(AIGatewayModelSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, name } = input;

      const aiGateway = await prisma.aIGateway.create({
        data: {
          workspaceId,
          name,
        },
      });

      return aiGateway;
    }),

  update: workspaceAdminProcedure
    .meta(
      buildAIGatewayOpenapi({
        method: 'PATCH',
        path: '/update',
      })
    )
    .input(
      z
        .object({
          gatewayId: z.string(),
        })
        .merge(aiGatewayCreateSchema)
    )
    .output(AIGatewayModelSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, gatewayId, name } = input;

      const aiGateway = await prisma.aIGateway.update({
        where: {
          id: gatewayId,
          workspaceId,
        },
        data: {
          name,
        },
      });

      return aiGateway;
    }),

  delete: workspaceAdminProcedure
    .meta(
      buildAIGatewayOpenapi({
        method: 'DELETE',
        path: '/delete',
      })
    )
    .input(
      z.object({
        gatewayId: z.string(),
      })
    )
    .output(AIGatewayModelSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, gatewayId } = input;

      const aiGateway = await prisma.aIGateway.delete({
        where: {
          id: gatewayId,
          workspaceId,
        },
      });

      return aiGateway;
    }),
  logs: workspaceProcedure
    .meta(
      buildAIGatewayOpenapi({
        method: 'GET',
        path: '/logs',
      })
    )
    .input(
      z.object({
        gatewayId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .output(
      buildCursorResponseSchema(
        AIGatewayLogsModelSchema.omit({
          requestPayload: true,
          responsePayload: true,
        }).merge(
          z.object({
            requestPayload: z.any().optional(),
            responsePayload: z.any().optional(),
          })
        )
      )
    )
    .query(async ({ input }) => {
      const { workspaceId, gatewayId, cursor, limit } = input;

      const { items, nextCursor } = await fetchDataByCursor(
        prisma.aIGatewayLogs,
        {
          where: {
            workspaceId,
            gatewayId,
          },
          limit,
          cursor,
          cursorName: 'id',
          order: 'desc',
        }
      );

      return {
        items: items as z.infer<typeof AIGatewayLogsModelSchema>[],
        nextCursor,
      };
    }),
});

function buildAIGatewayOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.AI],
      protect: true,
      ...meta,
      path: `/aiGateway${meta.path}`,
    },
  };
}
