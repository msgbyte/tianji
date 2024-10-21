import { prisma } from '../../model/_client.js';
import { promUserCounter, promWorkspaceCounter } from './client.js';

export function initCounter() {
  prisma.workspace.count().then((count) => {
    promWorkspaceCounter.set(count);
  });

  prisma.user.count().then((count) => {
    promUserCounter.set(count);
  });
}
