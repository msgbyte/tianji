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
import { clearGatewayInfoCache } from '../../model/aiGateway.js';
import { clearQuotaAlertCacheForGateway } from '../../model/aiGateway/quotaAlert.js';
import { logger } from '../../utils/logger.js';

const modelPricingData = await import(
  '../../utils/model_prices_and_context_window_v2.json',
  {
    with: { type: 'json' },
  }
).then((res) => res.default);

const aiGatewayCreateSchema = z.object({
  name: z.string().max(100),
  modelApiKey: z.string().nullable(),
  customModelBaseUrl: z.string().nullable(),
  customModelName: z.string().nullable(),
  customModelInputPrice: z.number().nullable(),
  customModelOutputPrice: z.number().nullable(),
});

export const aiGatewayRouter = router({
  all: workspaceProcedure
    .meta({
      openapi: {
        method: 'GET',
        path: '/workspace/{workspaceId}/aiGateway/all',
        tags: [OPENAPI_TAG.AI_GATEWAY],
        protect: true,
        summary: 'Get all gateways',
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

      return aiGateways.map((gateway) => ({
        ...gateway,
        customModelInputPrice: gateway.customModelInputPrice
          ? Number(gateway.customModelInputPrice)
          : null,
        customModelOutputPrice: gateway.customModelOutputPrice
          ? Number(gateway.customModelOutputPrice)
          : null,
      }));
    }),
  info: workspaceProcedure
    .meta(
      buildAIGatewayOpenapi({
        method: 'GET',
        path: '/info',
        summary: 'Get gateway info',
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

      if (!aiGateway) {
        return null;
      }

      return {
        ...aiGateway,
        customModelInputPrice: aiGateway.customModelInputPrice
          ? Number(aiGateway.customModelInputPrice)
          : null,
        customModelOutputPrice: aiGateway.customModelOutputPrice
          ? Number(aiGateway.customModelOutputPrice)
          : null,
      };
    }),
  create: workspaceAdminProcedure
    .meta({
      openapi: {
        method: 'POST',
        path: '/workspace/{workspaceId}/aiGateway/create',
        tags: [OPENAPI_TAG.APPLICATION],
        protect: true,
        summary: 'Create gateway',
      },
    })
    .input(aiGatewayCreateSchema)
    .output(AIGatewayModelSchema)
    .mutation(async ({ input }) => {
      const {
        workspaceId,
        name,
        modelApiKey,
        customModelBaseUrl,
        customModelName,
        customModelInputPrice,
        customModelOutputPrice,
      } = input;

      const aiGateway = await prisma.aIGateway.create({
        data: {
          workspaceId,
          name,
          modelApiKey,
          customModelBaseUrl,
          customModelName,
          customModelInputPrice,
          customModelOutputPrice,
        },
      });

      return {
        ...aiGateway,
        customModelInputPrice: aiGateway.customModelInputPrice
          ? Number(aiGateway.customModelInputPrice)
          : null,
        customModelOutputPrice: aiGateway.customModelOutputPrice
          ? Number(aiGateway.customModelOutputPrice)
          : null,
      };
    }),

  update: workspaceAdminProcedure
    .meta(
      buildAIGatewayOpenapi({
        method: 'PATCH',
        path: '/update',
        summary: 'Update gateway',
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
      const {
        workspaceId,
        gatewayId,
        name,
        modelApiKey,
        customModelBaseUrl,
        customModelName,
        customModelInputPrice,
        customModelOutputPrice,
      } = input;

      const aiGateway = await prisma.aIGateway.update({
        where: {
          id: gatewayId,
          workspaceId,
        },
        data: {
          name,
          modelApiKey,
          customModelBaseUrl,
          customModelName,
          customModelInputPrice,
          customModelOutputPrice,
        },
      });

      clearGatewayInfoCache(workspaceId, gatewayId);

      return {
        ...aiGateway,
        customModelInputPrice: aiGateway.customModelInputPrice
          ? Number(aiGateway.customModelInputPrice)
          : null,
        customModelOutputPrice: aiGateway.customModelOutputPrice
          ? Number(aiGateway.customModelOutputPrice)
          : null,
      };
    }),

  delete: workspaceAdminProcedure
    .meta(
      buildAIGatewayOpenapi({
        method: 'DELETE',
        path: '/delete',
        summary: 'Delete gateway',
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

      clearGatewayInfoCache(workspaceId, gatewayId);

      return {
        ...aiGateway,
        customModelInputPrice: aiGateway.customModelInputPrice
          ? Number(aiGateway.customModelInputPrice)
          : null,
        customModelOutputPrice: aiGateway.customModelOutputPrice
          ? Number(aiGateway.customModelOutputPrice)
          : null,
      };
    }),
  logs: workspaceProcedure
    .meta(
      buildAIGatewayOpenapi({
        method: 'GET',
        path: '/logs',
        summary: 'Get gateway logs',
      })
    )
    .input(
      z.object({
        gatewayId: z.string(),
        cursor: z.string().optional(),
        limit: z.number().int().min(1).max(100).default(20),
        logId: z.string().optional(),
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
      const { workspaceId, gatewayId, cursor, limit, logId } = input;

      const { items, nextCursor } = await fetchDataByCursor(
        prisma.aIGatewayLogs,
        {
          where: {
            workspaceId,
            gatewayId,
            ...(logId && { id: logId }),
          },
          limit,
          cursor,
          cursorName: 'id',
          order: 'desc',
        }
      );

      return {
        items: items.map((item) => ({
          ...item,
          price: Number(item.price),
        })) as z.infer<typeof AIGatewayLogsModelSchema>[],
        nextCursor,
      };
    }),
  modelPricing: workspaceProcedure
    .meta(
      buildAIGatewayOpenapi({
        method: 'GET',
        path: '/model-pricing',
        summary: 'Get model pricing',
      })
    )
    .input(
      z.object({
        search: z.string().optional(),
        limit: z.number().int().min(1).max(50).default(10),
      })
    )
    .output(
      z.object({
        providers: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            api: z.string().optional(),
            doc: z.string().optional(),
            models: z.array(
              z.object({
                id: z.string(),
                name: z.string(),
                attachment: z.boolean().optional(),
                reasoning: z.boolean().optional(),
                temperature: z.boolean().optional(),
                tool_call: z.boolean().optional(),
                knowledge: z.string().optional(),
                release_date: z.string().optional(),
                last_updated: z.string().optional(),
                modalities: z
                  .object({
                    input: z.array(z.string()).optional(),
                    output: z.array(z.string()).optional(),
                  })
                  .optional(),
                open_weights: z.boolean().optional(),
                cost: z
                  .object({
                    input: z.number().optional(),
                    output: z.number().optional(),
                    cache_read: z.number().optional(),
                  })
                  .optional(),
                limit: z
                  .object({
                    context: z.number().optional(),
                    output: z.number().optional(),
                  })
                  .optional(),
              })
            ),
          })
        ),
      })
    )
    .query(async ({ input }) => {
      const { search, limit } = input;

      try {
        const allModels = [];

        for (const [providerId, providerInfo] of Object.entries(
          modelPricingData
        )) {
          const provider = providerInfo as any;

          for (const [modelId, modelInfo] of Object.entries(
            provider.models || {}
          )) {
            const model = modelInfo as any;

            // Filter by search term if provided
            if (
              search &&
              !model.name.toLowerCase().includes(search.toLowerCase()) &&
              !modelId.toLowerCase().includes(search.toLowerCase()) &&
              !provider.name.toLowerCase().includes(search.toLowerCase())
            ) {
              continue;
            }

            allModels.push({
              providerId,
              providerName: provider.name,
              providerApi: provider.api,
              providerDoc: provider.doc,
              model: {
                id: modelId,
                name: model.name,
                attachment: model.attachment,
                reasoning: model.reasoning,
                temperature: model.temperature,
                tool_call: model.tool_call,
                knowledge: model.knowledge,
                release_date: model.release_date,
                last_updated: model.last_updated,
                modalities: model.modalities,
                open_weights: model.open_weights,
                cost: model.cost,
                limit: model.limit,
              },
            });
          }
        }

        // Limit total models returned
        const limitedModels = allModels.slice(0, limit);

        // Group models back by provider
        const providerMap = new Map();

        for (const item of limitedModels) {
          if (!providerMap.has(item.providerId)) {
            providerMap.set(item.providerId, {
              id: item.providerId,
              name: item.providerName,
              api: item.providerApi,
              doc: item.providerDoc,
              models: [],
            });
          }
          providerMap.get(item.providerId).models.push(item.model);
        }

        const providers = Array.from(providerMap.values());

        return { providers };
      } catch (error) {
        logger.error('Error reading model pricing data:', error);
        return { providers: [] };
      }
    }),
  quotaAlert: {
    get: workspaceProcedure
      .meta(
        buildAIGatewayOpenapi({
          method: 'GET',
          path: '/quota-alert',
          summary: 'Get quota alert',
        })
      )
      .input(
        z.object({
          gatewayId: z.string(),
        })
      )
      .output(
        z
          .object({
            id: z.string(),
            dailyQuota: z.number(),
            enabled: z.boolean(),
            notificationId: z.string().nullable(),
            lastAlertSentAt: z.date().nullable(),
            alertLevel80Sent: z.boolean(),
            alertLevel100Sent: z.boolean(),
            alertLevel150Sent: z.boolean(),
          })
          .nullable()
      )
      .query(async ({ input }) => {
        const { workspaceId, gatewayId } = input;

        const quotaAlert = await prisma.aIGatewayQuotaAlert.findFirst({
          where: {
            workspaceId,
            gatewayId,
          },
        });

        if (!quotaAlert) {
          return null;
        }

        return {
          id: quotaAlert.id,
          dailyQuota: Number(quotaAlert.dailyQuota),
          enabled: quotaAlert.enabled,
          notificationId: quotaAlert.notificationId,
          lastAlertSentAt: quotaAlert.lastAlertSentAt,
          alertLevel80Sent: quotaAlert.alertLevel80Sent,
          alertLevel100Sent: quotaAlert.alertLevel100Sent,
          alertLevel150Sent: quotaAlert.alertLevel150Sent,
        };
      }),

    upsert: workspaceAdminProcedure
      .meta(
        buildAIGatewayOpenapi({
          method: 'POST',
          path: '/quota-alert/upsert',
          summary: 'Upsert quota alert',
        })
      )
      .input(
        z.object({
          gatewayId: z.string(),
          dailyQuota: z.number().min(0),
          enabled: z.boolean(),
          notificationId: z.string().nullable(),
        })
      )
      .output(
        z.object({
          id: z.string(),
          dailyQuota: z.number(),
          enabled: z.boolean(),
          notificationId: z.string().nullable(),
        })
      )
      .mutation(async ({ input }) => {
        const { workspaceId, gatewayId, dailyQuota, enabled, notificationId } =
          input;

        const quotaAlert = await prisma.aIGatewayQuotaAlert.upsert({
          where: {
            workspaceId_gatewayId: {
              workspaceId,
              gatewayId,
            },
          },
          create: {
            workspaceId,
            gatewayId,
            dailyQuota,
            enabled,
            notificationId,
          },
          update: {
            dailyQuota,
            enabled,
            notificationId,
          },
        });

        // Clear cache after updating quota alert settings
        clearQuotaAlertCacheForGateway(workspaceId, gatewayId);

        return {
          id: quotaAlert.id,
          dailyQuota: Number(quotaAlert.dailyQuota),
          enabled: quotaAlert.enabled,
          notificationId: quotaAlert.notificationId,
        };
      }),

    delete: workspaceAdminProcedure
      .meta(
        buildAIGatewayOpenapi({
          method: 'DELETE',
          path: '/quota-alert/delete',
          summary: 'Delete quota alert',
        })
      )
      .input(
        z.object({
          gatewayId: z.string(),
        })
      )
      .output(z.boolean())
      .mutation(async ({ input }) => {
        const { workspaceId, gatewayId } = input;

        await prisma.aIGatewayQuotaAlert.deleteMany({
          where: {
            workspaceId,
            gatewayId,
          },
        });

        // Clear cache after deleting quota alert
        clearQuotaAlertCacheForGateway(workspaceId, gatewayId);

        return true;
      }),
  },
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
