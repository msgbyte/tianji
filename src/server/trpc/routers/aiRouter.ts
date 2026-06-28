import { z } from 'zod';
import {
  OpenApiMetaInfo,
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { OpenApiMeta } from 'trpc-to-openapi';
import { OPENAPI_TAG } from '../../utils/const.js';
import { prisma } from '../../model/_client.js';
import { fetchDataByCursor } from '../../utils/prisma.js';
import { buildCursorResponseSchema } from '../../utils/schema.js';
import {
  AIGatewayModelSchema,
  AIRouterLogsModelSchema,
  AIRouterModelSchema,
  AIRouterNodeModelSchema,
  AIRouterTierModelSchema,
} from '../../prisma/zod/index.js';
import {
  AI_ROUTER_PROVIDER_VALUES,
  isAIGatewayEligibleForAIRouter,
} from '../../model/aiRouter.js';

const aiRouterCreateSchema = z.object({
  name: z.string().trim().min(1).max(100),
  enabled: z.boolean().default(true),
});

const aiRouterNodeInputSchema = z.object({
  gatewayId: z.string(),
  provider: z.enum(AI_ROUTER_PROVIDER_VALUES).default('openai'),
  order: z.number().int().min(0),
  enabled: z.boolean().default(true),
  weight: z.number().int().min(0).max(100000).default(100),
  modelOverride: z.string().nullable().default(null),
  timeoutMs: z.number().int().min(1000).max(300000).default(30000),
  retryableStatusCodes: z.array(z.number().int().min(100).max(599)).default([]),
  failOnEmptyContent: z.boolean().default(false),
});

const aiRouterTierInputSchema = z.object({
  order: z.number().int().min(0),
  nodes: z.array(aiRouterNodeInputSchema),
});

export const aiRouterRouter = router({
  all: workspaceProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/workspace/{workspaceId}/aiRouter/all',
        tags: [OPENAPI_TAG.AI_ROUTER],
        protect: true,
        summary: 'Get all AI routers',
      },
    })
    .output(z.array(AIRouterModelSchema))
    .query(async ({ input }) => {
      return prisma.aIRouter.findMany({
        where: {
          workspaceId: input.workspaceId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });
    }),

  info: workspaceProcedure
    .meta(
      buildAIRouterOpenapi({
        method: 'GET',
        path: '/info',
        summary: 'Get AI router info',
      })
    )
    .input(
      z.object({
        routerId: z.string(),
      })
    )
    .output(
      AIRouterModelSchema.extend({
        tiers: z.array(
          AIRouterTierModelSchema.extend({
            nodes: z.array(
              AIRouterNodeModelSchema.extend({
                gateway: AIGatewayModelSchema,
              })
            ),
          })
        ),
      }).nullable()
    )
    .query(async ({ input }) => {
      const aiRouter = await prisma.aIRouter.findFirst({
        where: {
          workspaceId: input.workspaceId,
          id: input.routerId,
        },
        include: {
          tiers: {
            include: {
              nodes: {
                include: {
                  gateway: true,
                },
                orderBy: {
                  order: 'asc',
                },
              },
            },
            orderBy: {
              order: 'asc',
            },
          },
        },
      });

      return aiRouter ? (serializeAIRouterInfo(aiRouter) as any) : null;
    }),

  create: workspaceAdminProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/workspace/{workspaceId}/aiRouter/create',
        tags: [OPENAPI_TAG.AI_ROUTER],
        protect: true,
        summary: 'Create AI router',
      },
    })
    .input(aiRouterCreateSchema)
    .output(AIRouterModelSchema)
    .mutation(async ({ input }) => {
      return prisma.aIRouter.create({
        data: {
          workspaceId: input.workspaceId,
          name: input.name,
          enabled: input.enabled,
        },
      });
    }),

  update: workspaceAdminProcedure
    .meta(
      buildAIRouterOpenapi({
        method: 'PATCH',
        path: '/update',
        summary: 'Update AI router',
      })
    )
    .input(
      z
        .object({
          routerId: z.string(),
        })
        .merge(aiRouterCreateSchema)
    )
    .output(AIRouterModelSchema)
    .mutation(async ({ input }) => {
      const router = await prisma.aIRouter.findFirst({
        where: {
          workspaceId: input.workspaceId,
          id: input.routerId,
        },
      });

      if (!router) {
        throw new Error(`AI router not found: ${input.routerId}`);
      }

      return prisma.aIRouter.update({
        where: {
          id: router.id,
        },
        data: {
          name: input.name,
          enabled: input.enabled,
        },
      });
    }),

  delete: workspaceAdminProcedure
    .meta(
      buildAIRouterOpenapi({
        method: 'DELETE',
        path: '/delete',
        summary: 'Delete AI router',
      })
    )
    .input(
      z.object({
        routerId: z.string(),
      })
    )
    .output(AIRouterModelSchema)
    .mutation(async ({ input }) => {
      const router = await prisma.aIRouter.findFirst({
        where: {
          workspaceId: input.workspaceId,
          id: input.routerId,
        },
      });

      if (!router) {
        throw new Error(`AI router not found: ${input.routerId}`);
      }

      return prisma.aIRouter.delete({
        where: {
          id: router.id,
        },
      });
    }),

  compatibleGateways: workspaceProcedure
    .meta(
      buildAIRouterOpenapi({
        method: 'GET',
        path: '/compatible-gateways',
        summary: 'Get compatible gateways',
      })
    )
    .input(
      z.object({
        query: z.string().optional(),
      })
    )
    .output(z.array(AIGatewayModelSchema))
    .query(async ({ input }) => {
      const gateways = await prisma.aIGateway.findMany({
        where: {
          workspaceId: input.workspaceId,
          modelApiKey: {
            not: null,
          },
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return gateways
        .filter((gateway) => isAIGatewayEligibleForAIRouter(gateway))
        .map(serializeAIGatewayModel);
    }),

  replaceTiers: workspaceAdminProcedure
    .meta(
      buildAIRouterOpenapi({
        method: 'POST',
        path: '/replace-tiers',
        summary: 'Replace AI router tiers',
      })
    )
    .input(
      z.object({
        routerId: z.string(),
        tiers: z.array(aiRouterTierInputSchema),
      })
    )
    .output(
      z.array(
        AIRouterTierModelSchema.extend({
          nodes: z.array(
            AIRouterNodeModelSchema.extend({
              gateway: AIGatewayModelSchema,
            })
          ),
        })
      )
    )
    .mutation(async ({ input }) => {
      assertNoDuplicateTierOrders(input.tiers);
      input.tiers.forEach(assertNoDuplicateNodeOrders);

      return prisma.$transaction(async (tx) => {
        const router = await tx.aIRouter.findFirst({
          where: {
            workspaceId: input.workspaceId,
            id: input.routerId,
          },
        });

        if (!router) {
          throw new Error(`AI router not found: ${input.routerId}`);
        }

        const gateways = await tx.aIGateway.findMany({
          where: {
            workspaceId: input.workspaceId,
            id: {
              in: input.tiers.flatMap((tier) =>
                tier.nodes.map((node) => node.gatewayId)
              ),
            },
          },
        });
        const gatewayById = new Map(
          gateways.map((gateway) => [gateway.id, gateway])
        );

        for (const node of input.tiers.flatMap((tier) => tier.nodes)) {
          const gateway = gatewayById.get(node.gatewayId);

          if (!gateway) {
            throw new Error(`Gateway not found: ${node.gatewayId}`);
          }

          if (!isAIGatewayEligibleForAIRouter(gateway)) {
            throw new Error(
              `Gateway is not eligible for AI Router: ${node.gatewayId}`
            );
          }
        }

        await tx.aIRouterTier.deleteMany({
          where: {
            workspaceId: input.workspaceId,
            routerId: router.id,
          },
        });

        for (const tier of input.tiers) {
          const createdTier = await tx.aIRouterTier.create({
            data: {
              workspaceId: input.workspaceId,
              routerId: router.id,
              order: tier.order,
            },
          });

          if (tier.nodes.length > 0) {
            await tx.aIRouterNode.createMany({
              data: tier.nodes.map((node) => ({
                workspaceId: input.workspaceId,
                routerId: router.id,
                tierId: createdTier.id,
                gatewayId: node.gatewayId,
                provider: node.provider,
                order: node.order,
                enabled: node.enabled,
                weight: node.weight,
                modelOverride: node.modelOverride,
                timeoutMs: node.timeoutMs,
                retryableStatusCodes: node.retryableStatusCodes,
                failOnEmptyContent: node.failOnEmptyContent,
              })),
            });
          }
        }

        const tiers = await tx.aIRouterTier.findMany({
          where: {
            workspaceId: input.workspaceId,
            routerId: router.id,
          },
          include: {
            nodes: {
              include: {
                gateway: true,
              },
              orderBy: {
                order: 'asc',
              },
            },
          },
          orderBy: {
            order: 'asc',
          },
        });

        return tiers.map(serializeAIRouterTierModel) as any;
      });
    }),

  logs: workspaceProcedure
    .meta(
      buildAIRouterOpenapi({
        method: 'GET',
        path: '/logs',
        summary: 'Get AI router logs',
      })
    )
    .input(
      z.object({
        routerId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
      })
    )
    .output(buildCursorResponseSchema(AIRouterLogsModelSchema))
    .query(async ({ input }) => {
      const { items, nextCursor } = await fetchDataByCursor(
        prisma.aIRouterLogs,
        {
          where: {
            workspaceId: input.workspaceId,
            routerId: input.routerId,
          },
          limit: input.limit,
          cursor: input.cursor,
          cursorName: 'id',
          order: 'desc',
        }
      );

      return {
        items: items.map(serializeAIRouterLogModel),
        nextCursor,
      };
    }),
});

function assertNoDuplicateTierOrders(
  tiers: z.infer<typeof aiRouterTierInputSchema>[]
) {
  const seen = new Set<number>();

  for (const tier of tiers) {
    if (seen.has(tier.order)) {
      throw new Error(`Duplicate AI router tier order ${tier.order}`);
    }

    seen.add(tier.order);
  }
}

function assertNoDuplicateNodeOrders(
  tier: z.infer<typeof aiRouterTierInputSchema>
) {
  const seen = new Set<string>();

  for (const node of tier.nodes) {
    const key = String(node.order);

    if (seen.has(key)) {
      throw new Error(
        `Duplicate AI router node order ${node.order} in tier ${tier.order}`
      );
    }

    seen.add(key);
  }
}

function serializeAIGatewayModel<
  T extends {
    customModelInputPrice?: unknown;
    customModelOutputPrice?: unknown;
  },
>(gateway: T) {
  return {
    ...gateway,
    customModelInputPrice:
      gateway.customModelInputPrice === null ||
      gateway.customModelInputPrice === undefined
        ? null
        : Number(gateway.customModelInputPrice),
    customModelOutputPrice:
      gateway.customModelOutputPrice === null ||
      gateway.customModelOutputPrice === undefined
        ? null
        : Number(gateway.customModelOutputPrice),
  };
}

function serializeAIRouterInfo<
  T extends {
    tiers: Array<Parameters<typeof serializeAIRouterTierModel>[0]>;
  },
>(router: T) {
  return {
    ...router,
    tiers: router.tiers.map(serializeAIRouterTierModel),
  };
}

function serializeAIRouterTierModel<
  T extends {
    nodes: Array<{
      gateway: Parameters<typeof serializeAIGatewayModel>[0];
    }>;
  },
>(tier: T) {
  return {
    ...tier,
    nodes: tier.nodes.map((node) => ({
      ...node,
      gateway: serializeAIGatewayModel(node.gateway),
    })),
  };
}

function serializeAIRouterLogModel<
  T extends {
    attemptErrors?: unknown;
  },
>(log: T) {
  return {
    ...log,
    attemptErrors: normalizeAIRouterAttemptErrors(log.attemptErrors),
  };
}

function normalizeAIRouterAttemptErrors(attemptErrors: unknown) {
  if (Array.isArray(attemptErrors)) {
    return attemptErrors.filter(isRecord);
  }

  if (isRecord(attemptErrors)) {
    return [attemptErrors];
  }

  return null;
}

function isRecord(value: unknown): value is Record<string, any> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function buildAIRouterOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.AI_ROUTER],
      protect: true,
      ...meta,
      path: `/aiRouter${meta.path}`,
    },
  };
}
