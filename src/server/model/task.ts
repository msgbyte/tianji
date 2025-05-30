import { WorkspaceAuditLogType, WorkspaceTaskEnum } from '@prisma/client';
import { prisma } from './_client.js';
import { createAuditLog } from './auditLog.js';

export async function runTask(
  workspaceId: string,
  type: string,
  taskFn: () => Promise<any>
) {
  const task = await prisma.workspaceTask.create({
    data: {
      workspaceId,
      type,
      status: WorkspaceTaskEnum.Pending,
    },
  });

  const start = Date.now();
  try {
    const result = await taskFn();
    const meta = { result, usageTime: Date.now() - start };
    await prisma.workspaceTask.update({
      where: {
        id: task.id,
      },
      data: {
        status: WorkspaceTaskEnum.Success,
        meta,
      },
    });
    createAuditLog({
      workspaceId,
      relatedId: task.id,
      relatedType: WorkspaceAuditLogType.Task,
      content: `Task ${type} success, result: ${JSON.stringify(meta)}`,
    });
  } catch (err) {
    const meta = { error: String(err), usageTime: Date.now() - start };
    console.error('run task error:', meta);
    await prisma.workspaceTask.update({
      where: {
        id: task.id,
      },
      data: {
        status: WorkspaceTaskEnum.Failed,
        meta,
      },
    });
    createAuditLog({
      workspaceId,
      relatedId: task.id,
      relatedType: WorkspaceAuditLogType.Task,
      content: `Task ${type} failed, result: ${JSON.stringify(meta)}`,
    });
  }
}
