import { WorkspaceAuditLogType } from '@prisma/client';
import { prisma } from './_client.js';

/**
 * create audit log which can query by log
 */
export async function createAuditLog(info: {
  workspaceId: string;
  relatedId?: string;
  relatedType?: WorkspaceAuditLogType;
  content: string;
}) {
  try {
    const log = await prisma.workspaceAuditLog.create({
      data: {
        ...info,
      },
    });

    return log;
  } catch (err) {
    console.error('[AuditLog] create log error', String(err));
  }
}
