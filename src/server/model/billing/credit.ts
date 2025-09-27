import retry from 'async-retry';
import { prisma } from '../_client.js';
import { getWorkspaceTier } from './workspace.js';

export const tokenCreditFactor = 1.5;

export type CreditType = 'ai' | 'recharge' | 'bouns';

export async function getWorkspaceCredit(workspaceId: string): Promise<number> {
  const workspace = await prisma.workspace.findUnique({
    where: {
      id: workspaceId,
    },
    select: {
      credit: true,
    },
  });

  return workspace?.credit ?? 0;
}

export async function checkCredit(workspaceId: string) {
  const res = await prisma.workspace.findFirst({
    where: {
      id: workspaceId,
    },
    select: {
      credit: true,
    },
  });

  const credit = res?.credit ?? 0;
  if (credit <= 0) {
    const workspaceTier = await getWorkspaceTier(workspaceId);
    if (workspaceTier === 'UNLIMITED') {
      return;
    }

    throw new Error('Workspace not have enough credit');
  }
}

export async function costCredit(
  workspaceId: string,
  credit: number,
  type: CreditType,
  meta?: Record<string, any>
): Promise<number> {
  return retry(
    async () => {
      const [res] = await prisma.$transaction([
        prisma.workspace.update({
          where: {
            id: workspaceId,
          },
          data: {
            credit: {
              decrement: credit,
            },
          },
          select: {
            credit: true,
          },
        }),
        prisma.workspaceBill.create({
          data: {
            workspaceId,
            type,
            amount: -credit,
            meta,
          },
        }),
      ]);

      return res.credit;
    },
    {
      retries: 3,
    }
  );
}

export async function addCredit(
  workspaceId: string,
  credit: number,
  meta?: Record<string, any>
) {
  if (credit <= 0) {
    throw new Error('Credit should be greater than zero');
  }

  const [res] = await prisma.$transaction([
    prisma.workspace.update({
      where: {
        id: workspaceId,
      },
      data: {
        credit: {
          increment: credit,
        },
      },
      select: {
        credit: true,
      },
    }),
    prisma.workspaceBill.create({
      data: {
        workspaceId,
        type: 'recharge',
        amount: credit,
        meta,
      },
    }),
  ]);

  return res.credit;
}
