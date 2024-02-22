import { z } from 'zod';
import {
  OpenApiMetaInfo,
  router,
  workspaceOwnerProcedure,
  workspaceProcedure,
} from '../trpc';
import { OPENAPI_TAG } from '../../utils/const';
import { prisma } from '../../model/_client';
import { TelemetryModelSchema } from '../../prisma/zod';
import { OpenApiMeta } from 'trpc-openapi';

export const telemetryRouter = router({
  all: workspaceProcedure
    .meta(
      buildTelemetryOpenapi({
        method: 'GET',
        path: '/all',
      })
    )
    .output(z.array(TelemetryModelSchema))
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const res = await prisma.telemetry.findMany({
        where: {
          workspaceId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return res;
    }),
  eventCount: workspaceProcedure
    .meta(
      buildTelemetryOpenapi({
        method: 'GET',
        path: '/eventCount',
      })
    )
    .input(
      z.object({
        telemetryId: z.string(),
      })
    )
    .output(z.number())
    .query(async ({ input }) => {
      const { workspaceId, telemetryId } = input;

      const count = await prisma.telemetryEvent.count({
        where: {
          workspaceId,
          telemetryId,
        },
      });

      return count;
    }),
  upsert: workspaceOwnerProcedure
    .meta(
      buildTelemetryOpenapi({
        method: 'POST',
        path: '/upsert',
      })
    )
    .input(
      z.object({
        telemetryId: z.string().optional(),
        name: z.string(),
      })
    )
    .output(TelemetryModelSchema)
    .mutation(async ({ input }) => {
      const { workspaceId, telemetryId, name } = input;

      if (telemetryId) {
        return prisma.telemetry.update({
          where: {
            id: telemetryId,
            workspaceId,
          },
          data: {
            name,
          },
        });
      } else {
        return prisma.telemetry.create({
          data: {
            workspaceId,
            name,
          },
        });
      }
    }),
});

function buildTelemetryOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.TELEMETRY],
      protect: true,
      ...meta,
      path: `/workspace/{workspaceId}${meta.path}`,
    },
  };
}
