import {
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { prisma } from '../../model/_client.js';
import { z } from 'zod';
import {
  FunctionWorkerModelSchema,
  FunctionWorkerRevisionModelSchema,
} from '../../prisma/zod/index.js';
import { createAuditLog } from '../../model/auditLog.js';
import { execWorker } from '../../model/worker/index.js';
import {
  FunctionWorkerExecutionStatus,
  WorkspaceAuditLogType,
} from '@prisma/client';
import { env } from '../../utils/env.js';
import { workerCronManager } from '../../model/worker/manager.js';

export const workerRouter = router({
  // Get all workers in workspace
  all: workspaceProcedure
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
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { workerId, workspaceId } = input;

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

      const execution = await execWorker(worker.code, workerId, undefined, {
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
        avgDuration: result.avgDuration,
        avgMemoryUsed: result.avgMemoryUsed,
        avgCpuTime: result.avgCpuTime,
      };
    }),
  testCode: workspaceAdminProcedure
    .input(
      z.object({
        code: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { code } = input;

      if (!env.enableFunctionWorker) {
        throw new Error('Function worker is not enabled');
      }

      const execution = await execWorker(code, undefined, undefined, {
        type: 'test',
      });

      return execution;
    }),

  getRevisions: workspaceProcedure
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
