import { WorkspaceAuditLogType } from '@prisma/client';
import { prisma } from './_client.js';

const SENSITIVE_FIELD =
  /password|secret|token|authorization|api[-_]?key|cookie|signature|credential|connection(?:string|uri)?|database[-_]?(?:url|uri)|webhook|private[-_]?key|^(?:code|source|script|prompt)$/i;
const RELATED_TYPE_BY_ROUTER: Partial<
  Record<string, WorkspaceAuditLogType>
> = {
  monitor: WorkspaceAuditLogType.Monitor,
  notification: WorkspaceAuditLogType.Notification,
  sharedModule: WorkspaceAuditLogType.SharedModule,
  user: WorkspaceAuditLogType.User,
  worker: WorkspaceAuditLogType.FunctionWorker,
  workspace: WorkspaceAuditLogType.Workspace,
};

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

export async function createWorkspaceMutationAuditLog(info: {
  workspaceId: string;
  path: string;
  input: unknown;
  actor: { id?: string | null; username?: string | null };
  relatedId?: string;
  relatedType?: WorkspaceAuditLogType;
}) {
  const input = isRecord(info.input) ? info.input : {};
  const relatedId = info.relatedId ?? findRelatedId(input);
  const changes = Object.fromEntries(
    Object.entries(input)
      .filter(([key]) => key !== 'workspaceId')
      .slice(0, 50)
      .map(([key, value]) => [key, sanitizeValue(key, value, 0, input)])
  );
  const actor = `${info.actor.username ?? 'unknown'}(${info.actor.id ?? 'unknown'})`;
  const target = relatedId ? ` on ${relatedId}` : '';
  const content = `Performed ${info.path}${target} by ${actor}; changes: ${JSON.stringify(changes)}`;

  return createAuditLog({
    workspaceId: info.workspaceId,
    relatedId,
    relatedType:
      info.relatedType ?? RELATED_TYPE_BY_ROUTER[info.path.split('.')[0]],
    content: content.length > 4000 ? `${content.slice(0, 3997)}...` : content,
  });
}

function findRelatedId(input: Record<string, unknown>) {
  const entries = Object.entries(input);
  const exactId = entries.find(
    ([key, value]) => key === 'id' && typeof value === 'string'
  );
  const resourceId = entries.find(
    ([key, value]) =>
      key !== 'workspaceId' && key.endsWith('Id') && typeof value === 'string'
  );

  return (exactId ?? resourceId)?.[1] as string | undefined;
}

function sanitizeValue(
  key: string,
  value: unknown,
  depth: number,
  parent?: Record<string, unknown>
): unknown {
  if (SENSITIVE_FIELD.test(key) || (key === 'value' && parent?.type === 'Secret')) {
    return '[REDACTED]';
  }
  if (typeof value === 'string') {
    return value.length > 200 ? `${value.slice(0, 197)}...` : value;
  }
  if (value === null || ['number', 'boolean'].includes(typeof value)) {
    return value;
  }
  if (depth >= 3) {
    return '[CHANGED]';
  }
  if (Array.isArray(value)) {
    return value
      .slice(0, 20)
      .map((item) => sanitizeValue('', item, depth + 1));
  }
  if (isRecord(value)) {
    return Object.fromEntries(
      Object.entries(value)
        .slice(0, 50)
        .map(([childKey, childValue]) => [
          childKey,
          sanitizeValue(childKey, childValue, depth + 1, value),
        ])
    );
  }

  return String(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
