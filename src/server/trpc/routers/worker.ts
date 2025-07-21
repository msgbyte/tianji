import {
  router,
  workspaceAdminProcedure,
  workspaceProcedure,
} from '../trpc.js';
import { prisma } from '../../model/_client.js';
import { z } from 'zod';
import { FunctionWorkerModelSchema } from '../../prisma/zod/index.js';
import { createAuditLog } from '../../model/auditLog.js';
import { execWorker } from '../../model/worker/index.js';
import { FunctionWorkerExecutionStatus } from '@prisma/client';

export const workerRouter = router({
  // Get all workers in workspace
  all: workspaceProcedure
    .input(z.object({}))
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
        workerId: z.string().cuid2(),
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
        id: z.string().cuid2().optional(),
        name: z.string().min(1, 'Name is required'),
        description: z.string().optional(),
        code: z.string().min(1, 'Code is required'),
        active: z.boolean().default(true),
      })
    )
    .output(FunctionWorkerModelSchema)
    .mutation(async ({ input, ctx }) => {
      const { id, name, description, code, active, workspaceId } = input;

      const worker = await prisma.functionWorker.upsert({
        where: {
          id: id || '',
        },
        create: {
          workspaceId,
          name,
          description,
          code,
          active,
        },
        update: {
          name,
          description,
          code,
          active,
        },
      });

      await createAuditLog({
        workspaceId,
        relatedId: worker.id,
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
        workerId: z.string().cuid2(),
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

      const deletedWorker = await prisma.functionWorker.delete({
        where: {
          id: workerId,
          workspaceId,
        },
      });

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

      const updatedWorker = await prisma.functionWorker.update({
        where: {
          id: workerId,
          workspaceId,
        },
        data: {
          active,
        },
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
        workerId: z.string().cuid2(),
      })
    )
    .mutation(async ({ input, ctx }) => {
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

      const execution = await execWorker(workerId);

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
        workerId: z.string().cuid2(),
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
        workerId: z.string().cuid2(),
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

      const executions = await prisma.functionWorkerExecution.findMany({
        where: {
          workerId,
          createdAt: {
            gte: since,
          },
        },
      });

      const totalExecutions = executions.length;
      const successExecutions = executions.filter(
        (e) => e.status === FunctionWorkerExecutionStatus.Success
      ).length;
      const failedExecutions = executions.filter(
        (e) => e.status === FunctionWorkerExecutionStatus.Failed
      ).length;

      const durations = executions
        .filter((e) => e.duration !== null)
        .map((e) => e.duration!);
      const avgDuration =
        durations.length > 0
          ? durations.reduce((sum, d) => sum + d, 0) / durations.length
          : null;

      const memoryUsages = executions
        .filter((e) => e.memoryUsed !== null)
        .map((e) => e.memoryUsed!);
      const avgMemoryUsed =
        memoryUsages.length > 0
          ? memoryUsages.reduce((sum, m) => sum + m, 0) / memoryUsages.length
          : null;

      const cpuTimes = executions
        .filter((e) => e.cpuTime !== null)
        .map((e) => e.cpuTime!);
      const avgCpuTime =
        cpuTimes.length > 0
          ? cpuTimes.reduce((sum, c) => sum + c, 0) / cpuTimes.length
          : null;

      return {
        totalExecutions,
        successExecutions,
        failedExecutions,
        avgDuration,
        avgMemoryUsed,
        avgCpuTime,
      };
    }),
});
