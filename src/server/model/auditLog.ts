import { WorkspaceAuditLogType } from '@prisma/client';
import { prisma } from './_client';

/**
 * create audit log which can query by log
 */
export async function createAuditLog(info: {
  workspaceId: string;
  relatedId?: string;
  relatedType?: WorkspaceAuditLogType;
  content: string;
}) {
  const log = await prisma.workspaceAuditLog.create({
    data: {
      ...info,
    },
  });

  return log;
}
