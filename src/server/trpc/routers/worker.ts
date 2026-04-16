import {
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
  OpenApiMetaInfo,
} from '../trpc.js';
import { prisma } from '../../model/_client.js';
import { z } from 'zod';
import {
  FunctionWorkerModelSchema,
  FunctionWorkerRevisionModelSchema,
  FunctionWorkerExecutionModelSchema,
} from '../../prisma/zod/index.js';
import { createAuditLog } from '../../model/auditLog.js';
import { execWorker } from '../../model/worker/index.js';
import { WorkspaceAuditLogType } from '@prisma/client';
import { env } from '../../utils/env.js';
import { workerCronManager } from '../../model/worker/manager.js';
import { OPENAPI_TAG } from '../../utils/const.js';
import { OpenApiMeta } from 'trpc-to-openapi';

export const workerRouter = router({
  // Get all workers in workspace
  all: workspaceProcedure
    .meta(
      buildWorkerOpenapi({
        method: 'GET',
        path: '/all',
        summary: 'Get all workers in workspace',
      })
    )
    .output(z.array(FunctionWorkerModelSchema))
    .query(async ({ input }) => {
      const { workspaceId } = input;

      const workers = await prisma.functionWorker.findMany({
        where: {
          workspaceId,
        },
        orderBy: {
          updatedAt: 'desc',
        },
      });

      return workers;
    }),

  // Get specific worker by id
  get: workspaceProcedure
    .meta(
      buildWorkerOpenapi({
        method: 'GET',
        path: '/{workerId}/info',
        summary: 'Get worker by ID',
      })
    )
    .input(
      z.object({
        workerId: z.cuid2(),
      })
    )
    .output(FunctionWorkerModelSchema.nullable())
    .query(async ({ input }) => {
      const { workerId, workspaceId } = input;

      const worker = await prisma.functionWorker.findUnique({
        where: {
          id: workerId,
          workspaceId,
        },
      });

      return worker;
    }),

  // Create or update worker
  upsert: workspaceAdminProcedure
    .meta(
      buildWorkerOpenapi({
        method: 'POST',
        path: '/upsert',
        summary: 'Create or update worker',
      })
    )
    .input(
      z.object({
        id: z.cuid2().optional(),
        name: z.string().min(1, 'Name is required'),
        description: z.string().optional(),
        code: z.string().min(1, 'Code is required'),
        active: z.boolean().default(true),
        enableCron: z.boolean().default(false),
        cronExpression: z.string().optional(),
      })
    )
    .output(FunctionWorkerModelSchema)
    .mutation(async ({ input, ctx }) => {
      const {
        id,
        name,
        description,
        code,
        active,
        enableCron,
        cronExpression,
        workspaceId,
      } = input;

      // Validate cron expression if provided
      if (enableCron && cronExpression) {
        try {
          const { Cron } = await import('croner');
          const cronJob = new Cron(cronExpression, { paused: true }); // Test cron expression validity

          // Check if interval is less than 1 minute
          const now = new Date();
          const nextRun = cronJob.nextRun(now);
          if (!nextRun) {
            throw new Error(
              `Invalid cron expression: ${cronExpression}. Unable to calculate next execution time`
            );
          }

          const secondRun = cronJob.nextRun(nextRun);
          if (!secondRun) {
            throw new Error(
              `Invalid cron expression: ${cronExpression}. Unable to calculate subsequent execution time`
            );
          }

          const intervalMs = secondRun.getTime() - nextRun.getTime();
          const intervalSeconds = intervalMs / 1000;

          if (intervalSeconds < 60) {
            throw new Error(
              `Cron expression interval is too frequent. Minimum interval is 1 minute, but got ${intervalSeconds} seconds`
            );
          }
        } catch (err) {
          if (err instanceof Error) {
            throw err;
          }
          throw new Error(`Invalid cron expression: ${cronExpression}`);
        }
      }

      const worker = await workerCronManager.upsert({
        id,
        workspaceId,
        name,
        description,
        code,
        active,
        enableCron,
        cronExpression: cronExpression || null,
      });

      await createAuditLog({
        workspaceId,
        relatedId: worker.id,
        relatedType: WorkspaceAuditLogType.FunctionWorker,
        content: id
          ? `Updated worker: ${name} by ${ctx.user?.username}(${ctx.user?.id})`
          : `Created worker: ${name} by ${ctx.user?.username}(${ctx.user?.id})`,
      });

      return worker;
    }),

  // Delete worker
  delete: workspaceAdminProcedure
    .meta(
      buildWorkerOpenapi({
        method: 'DELETE',
        path: '/{workerId}/delete',
        summary: 'Delete worker',
      })
    )
    .input(
      z.object({
        workerId: z.cuid2(),
      })
    )
    .output(FunctionWorkerModelSchema)
    .mutation(async ({ input, ctx }) => {
      const { workerId, workspaceId } = input;

      const worker = await prisma.functionWorker.findUnique({
        where: {
          id: workerId,
          workspaceId,
        },
      });

      if (!worker) {
        throw new Error('Worker not found');
      }

      const deletedWorker = await workerCronManager.delete(
        workspaceId,
        workerId
      );

      await createAuditLog({
        workspaceId,
        relatedId: workerId,
        content: `Deleted worker: ${worker.name} by ${ctx.user?.username}(${ctx.user?.id})`,
      });

      return deletedWorker;
    }),

  // Toggle worker active status
  toggleActive: workspaceAdminProcedure
    .meta(
      buildWorkerOpenapi({
        method: 'PATCH',
        path: '/{workerId}/toggleActive',
        summary: 'Toggle worker active status',
      })
    )
    .input(
      z.object({
        workerId: z.string().cuid2(),
        active: z.boolean(),
      })
    )
    .output(FunctionWorkerModelSchema)
    .mutation(async ({ input, ctx }) => {
      const { workerId, active, workspaceId } = input;

      const worker = await prisma.functionWorker.findUnique({
        where: {
          id: workerId,
          workspaceId,
        },
      });

      if (!worker) {
        throw new Error('Worker not found');
      }

      // Use workerCronManager.upsert to update both database and cron manager state
      const updatedWorker = await workerCronManager.upsert({
        id: workerId,
        workspaceId,
        name: worker.name,
        description: worker.description ?? undefined,
        code: worker.code,
        active,
        enableCron: worker.enableCron,
        cronExpression: worker.cronExpression,
      });

      await createAuditLog({
        workspaceId,
        relatedId: workerId,
        content: `${active ? 'Activated' : 'Deactivated'} worker: ${worker.name} by ${ctx.user?.username}(${ctx.user?.id})`,
      });

      return updatedWorker;
    }),

  // Execute worker
  execute: workspaceProcedure
    .input(
      z.object({
        workerId: z.cuid2(),
        payload: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { workerId, workspaceId, payload = undefined } = input;

      if (!env.enableFunctionWorker) {
        throw new Error('Function worker is not enabled');
      }

      // Verify worker exists and belongs to workspace
      const worker = await prisma.functionWorker.findUnique({
        where: {
          id: workerId,
          workspaceId,
        },
      });

      if (!worker) {
        throw new Error('Worker not found');
      }

      const execution = await execWorker(worker.code, workerId, payload, {
        type: 'manual',
      });

      await createAuditLog({
        workspaceId,
        relatedId: workerId,
        content: `Executed worker: ${worker.name} (Status: ${execution.status}) by ${ctx.user?.username}(${ctx.user?.id})`,
      });

      return execution;
    }),

  // Get worker execution history
  getExecutions: workspaceProcedure
    .input(
      z.object({
        workerId: z.cuid2(),
        page: z.number().min(1).default(1),
        pageSize: z.number().min(1).max(100).default(20),
      })
    )
    .query(async ({ input }) => {
      const { workerId, workspaceId, page, pageSize } = input;

      // Verify worker exists and belongs to workspace
      const worker = await prisma.functionWorker.findUnique({
        where: {
          id: workerId,
          workspaceId,
        },
      });

      if (!worker) {
        throw new Error('Worker not found');
      }

      const [executions, total] = await Promise.all([
        prisma.functionWorkerExecution.findMany({
          where: {
            workerId,
          },
          orderBy: {
            createdAt: 'desc',
          },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.functionWorkerExecution.count({
          where: {
            workerId,
          },
        }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        executions,
        pagination: {
          page,
          pageSize,
          total,
          totalPages,
        },
      };
    }),

  // Get execution statistics
  getExecutionStats: workspaceProcedure
    .input(
      z.object({
        workerId: z.cuid2(),
        days: z.number().min(1).max(90).default(7),
      })
    )
    .output(
      z.object({
        totalExecutions: z.number(),
        successExecutions: z.number(),
        failedExecutions: z.number(),
        avgDuration: z.number().nullable(),
        avgMemoryUsed: z.number().nullable(),
        avgCpuTime: z.number().nullable(),
      })
    )
    .query(async ({ input }) => {
      const { workerId, workspaceId, days } = input;

      // Verify worker exists and belongs to workspace
      const worker = await prisma.functionWorker.findUnique({
        where: {
          id: workerId,
          workspaceId,
        },
      });

      if (!worker) {
        throw new Error('Worker not found');
      }

      const since = new Date();
      since.setDate(since.getDate() - days);

      // Use single SQL query for all statistics
      const stats = await prisma.$queryRaw<
        Array<{
          totalExecutions: bigint;
          successExecutions: bigint;
          failedExecutions: bigint;
          avgDuration: number | null;
          avgMemoryUsed: number | null;
          avgCpuTime: number | null;
        }>
      >`
        SELECT
          COUNT(*)::int as "totalExecutions",
          COUNT(CASE WHEN status = 'Success' THEN 1 END)::int as "successExecutions",
          COUNT(CASE WHEN status = 'Failed' THEN 1 END)::int as "failedExecutions",
          AVG(duration) as "avgDuration",
          AVG("memoryUsed") as "avgMemoryUsed",
          AVG("cpuTime") as "avgCpuTime"
        FROM "FunctionWorkerExecution"
        WHERE "workerId" = ${workerId}
          AND "createdAt" >= ${since}
      `;

      const result = stats[0];

      return {
        totalExecutions: Number(result.totalExecutions),
        successExecutions: Number(result.successExecutions),
        failedExecutions: Number(result.failedExecutions),
        avgDuration: Number(result.avgDuration),
        avgMemoryUsed: Number(result.avgMemoryUsed),
        avgCpuTime: Number(result.avgCpuTime),
      };
    }),

  // Get execution trend for sparkline (last 24 hours, grouped by hour)
  getExecutionTrend: workspaceProcedure
    .input(
      z.object({
        workerId: z.cuid2(),
      })
    )
    .output(
      z.array(
        z.object({
          date: z.string(),
          value: z.number(),
        })
      )
    )
    .query(async ({ input }) => {
      const { workerId, workspaceId } = input;

      // Verify worker exists and belongs to workspace
      const worker = await prisma.functionWorker.findUnique({
        where: {
          id: workerId,
          workspaceId,
        },
      });

      if (!worker) {
        throw new Error('Worker not found');
      }

      // Calculate time range for last 24 hours
      const endDate = new Date();
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - 24);

      // Query execution counts grouped by hour
      const trendData = await prisma.$queryRaw<
        Array<{
          hour: Date;
          count: bigint;
        }>
      >`
        SELECT
          DATE_TRUNC('hour', "createdAt") as hour,
          COUNT(*)::int as count
        FROM "FunctionWorkerExecution"
        WHERE "workerId" = ${workerId}
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
        GROUP BY DATE_TRUNC('hour', "createdAt")
        ORDER BY hour ASC
      `;

      // Convert to the format expected by frontend
      return trendData.map((item) => ({
        date: item.hour.toISOString(),
        value: Number(item.count),
      }));
    }),

  // Get hourly execution stats for charts (last 24 hours)
  getExecutionHourlyStats: workspaceProcedure
    .input(
      z.object({
        workerId: z.cuid2(),
      })
    )
    .output(
      z.array(
        z.object({
          date: z.string(),
          count: z.number(),
          successCount: z.number(),
          failedCount: z.number(),
          avgDuration: z.number(),
          p75Duration: z.number(),
          p90Duration: z.number(),
          p99Duration: z.number(),
          avgMemoryUsed: z.number(),
          p75MemoryUsed: z.number(),
          p90MemoryUsed: z.number(),
          p99MemoryUsed: z.number(),
          avgCpuTime: z.number(),
          p75CpuTime: z.number(),
          p90CpuTime: z.number(),
          p99CpuTime: z.number(),
        })
      )
    )
    .query(async ({ input }) => {
      const { workerId, workspaceId } = input;

      const worker = await prisma.functionWorker.findUnique({
        where: {
          id: workerId,
          workspaceId,
        },
      });

      if (!worker) {
        throw new Error('Worker not found');
      }

      const endDate = new Date();
      const startDate = new Date();
      startDate.setHours(startDate.getHours() - 24);

      const hourlyData = await prisma.$queryRaw<
        Array<{
          hour: Date;
          count: bigint;
          successCount: bigint;
          failedCount: bigint;
          avgDuration: number | null;
          p75Duration: number | null;
          p90Duration: number | null;
          p99Duration: number | null;
          avgMemoryUsed: number | null;
          p75MemoryUsed: number | null;
          p90MemoryUsed: number | null;
          p99MemoryUsed: number | null;
          avgCpuTime: number | null;
          p75CpuTime: number | null;
          p90CpuTime: number | null;
          p99CpuTime: number | null;
        }>
      >`
        SELECT
          DATE_TRUNC('hour', "createdAt") as hour,
          COUNT(*)::int as count,
          COUNT(CASE WHEN status = 'Success' THEN 1 END)::int as "successCount",
          COUNT(CASE WHEN status = 'Failed' THEN 1 END)::int as "failedCount",
          AVG(duration) as "avgDuration",
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY duration) as "p75Duration",
          PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY duration) as "p90Duration",
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY duration) as "p99Duration",
          AVG("memoryUsed") as "avgMemoryUsed",
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY "memoryUsed") as "p75MemoryUsed",
          PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY "memoryUsed") as "p90MemoryUsed",
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY "memoryUsed") as "p99MemoryUsed",
          AVG("cpuTime") as "avgCpuTime",
          PERCENTILE_CONT(0.75) WITHIN GROUP (ORDER BY "cpuTime") as "p75CpuTime",
          PERCENTILE_CONT(0.90) WITHIN GROUP (ORDER BY "cpuTime") as "p90CpuTime",
          PERCENTILE_CONT(0.99) WITHIN GROUP (ORDER BY "cpuTime") as "p99CpuTime"
        FROM "FunctionWorkerExecution"
        WHERE "workerId" = ${workerId}
          AND "createdAt" >= ${startDate}
          AND "createdAt" <= ${endDate}
        GROUP BY DATE_TRUNC('hour', "createdAt")
        ORDER BY hour ASC
      `;

      const toNum = (v: number | null) => Math.round(Number(v ?? 0));

      return hourlyData.map((item) => ({
        date: item.hour.toISOString(),
        count: Number(item.count),
        successCount: Number(item.successCount),
        failedCount: Number(item.failedCount),
        avgDuration: toNum(item.avgDuration),
        p75Duration: toNum(item.p75Duration),
        p90Duration: toNum(item.p90Duration),
        p99Duration: toNum(item.p99Duration),
        avgMemoryUsed: toNum(item.avgMemoryUsed),
        p75MemoryUsed: toNum(item.p75MemoryUsed),
        p90MemoryUsed: toNum(item.p90MemoryUsed),
        p99MemoryUsed: toNum(item.p99MemoryUsed),
        avgCpuTime: toNum(item.avgCpuTime),
        p75CpuTime: toNum(item.p75CpuTime),
        p90CpuTime: toNum(item.p90CpuTime),
        p99CpuTime: toNum(item.p99CpuTime),
      }));
    }),
  testCode: workspaceAdminProcedure
    .input(
      z.object({
        code: z.string(),
        payload: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { code, payload = undefined } = input;

      if (!env.enableFunctionWorker) {
        throw new Error('Function worker is not enabled');
      }

      const execution = await execWorker(code, undefined, payload, {
        type: 'test',
      });

      return execution;
    }),

  rollbackToRevision: workspaceAdminProcedure
    .meta(
      buildWorkerOpenapi({
        method: 'POST',
        path: '/{workerId}/rollback',
        summary: 'Rollback worker to a specific revision',
      })
    )
    .input(
      z.object({
        workerId: z.string().cuid2(),
        revisionId: z.string().cuid2(),
      })
    )
    .output(FunctionWorkerModelSchema)
    .mutation(async ({ input, ctx }) => {
      const { workerId, revisionId, workspaceId } = input;

      const worker = await prisma.functionWorker.findUnique({
        where: {
          id: workerId,
          workspaceId,
        },
      });

      if (!worker) {
        throw new Error('Worker not found');
      }

      const revision = await prisma.functionWorkerRevision.findUnique({
        where: {
          id: revisionId,
          workerId,
        },
      });

      if (!revision) {
        throw new Error('Revision not found');
      }

      if (revision.code === worker.code) {
        return worker;
      }

      const updatedWorker = await workerCronManager.upsert({
        id: workerId,
        workspaceId,
        name: worker.name,
        description: worker.description ?? undefined,
        code: revision.code,
        active: worker.active,
        enableCron: worker.enableCron,
        cronExpression: worker.cronExpression,
      });

      await createAuditLog({
        workspaceId,
        relatedId: workerId,
        relatedType: WorkspaceAuditLogType.FunctionWorker,
        content: `Rolled back worker: ${worker.name} to revision #${revision.revision} by ${ctx.user?.username}(${ctx.user?.id})`,
      });

      return updatedWorker;
    }),

  getRevisions: workspaceProcedure
    .meta(
      buildWorkerOpenapi({
        method: 'GET',
        path: '/{workerId}/revisions',
        summary: 'Get worker revisions',
      })
    )
    .input(
      z.object({
        workerId: z.string().cuid2(),
      })
    )
    .output(z.array(FunctionWorkerRevisionModelSchema))
    .query(async ({ input }) => {
      const { workerId, workspaceId } = input;

      const worker = await prisma.functionWorker.findUnique({
        where: {
          id: workerId,
          workspaceId,
        },
      });

      if (!worker) {
        throw new Error('Worker not found');
      }

      const revisions = await prisma.functionWorkerRevision.findMany({
        where: {
          workerId,
        },
        orderBy: {
          revision: 'desc',
        },
      });

      return revisions;
    }),
});

function buildWorkerOpenapi(meta: OpenApiMetaInfo): OpenApiMeta {
  return {
    openapi: {
      tags: [OPENAPI_TAG.WORKER],
      protect: true,
      ...meta,
      path: `/workspace/{workspaceId}/worker${meta.path}`,
    },
  };
}
