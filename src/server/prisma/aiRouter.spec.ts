import { Prisma } from '@prisma/client';
import { describe, expect, test } from 'vitest';
import { prisma } from '../model/_client.js';

function isMissingSchemaError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    (error.code === 'P2021' || error.code === 'P2022')
  );
}

function isUnavailableDatabaseError(error: unknown) {
  return (
    error instanceof Prisma.PrismaClientInitializationError &&
    (error.errorCode === 'P1001' ||
      error.message.includes("Can't reach database server"))
  );
}

async function ignoreMissingSchema(callback: () => Promise<unknown>) {
  try {
    await callback();
  } catch (err) {
    if (!isMissingSchemaError(err)) {
      throw err;
    }
  }
}

describe('AI Router database constraints', () => {
  test('allows workspace deletion to cascade through gateway-backed router nodes', async () => {
    let workspaceId: string | null = null;

    try {
      const workspace = await prisma.workspace.create({
        data: {
          name: 'AI Router FK Test',
        },
      });
      workspaceId = workspace.id;

      const gateway = await prisma.aIGateway.create({
        data: {
          workspaceId,
          name: 'Test Gateway',
        },
      });
      const router = await prisma.aIRouter.create({
        data: {
          workspaceId,
          name: 'Test Router',
        },
      });
      const tier = await prisma.aIRouterTier.create({
        data: {
          workspaceId,
          routerId: router.id,
          order: 0,
        },
      });
      await prisma.aIRouterNode.create({
        data: {
          workspaceId,
          routerId: router.id,
          tierId: tier.id,
          gatewayId: gateway.id,
          order: 0,
        },
      });

      await expect(
        prisma.aIGateway.delete({
          where: { id: gateway.id },
        })
      ).rejects.toThrow();

      await expect(
        prisma.workspace.delete({
          where: { id: workspaceId },
        })
      ).resolves.toMatchObject({ id: workspaceId });

      workspaceId = null;
    } catch (err) {
      if (isUnavailableDatabaseError(err)) {
        return;
      }

      throw err;
    } finally {
      if (workspaceId) {
        const id = workspaceId;
        await ignoreMissingSchema(() =>
          prisma.aIRouterNode.deleteMany({
            where: { workspaceId: id },
          })
        );
        await ignoreMissingSchema(() =>
          prisma.aIRouterLogs.deleteMany({
            where: { workspaceId: id },
          })
        );
        await ignoreMissingSchema(() =>
          prisma.aIRouterTier.deleteMany({
            where: { workspaceId: id },
          })
        );
        await ignoreMissingSchema(() =>
          prisma.aIRouter.deleteMany({
            where: { workspaceId: id },
          })
        );
        await ignoreMissingSchema(() =>
          prisma.aIGateway.deleteMany({
            where: { workspaceId: id },
          })
        );
        await prisma.workspace.deleteMany({
          where: { id },
        });
      }
    }
  });
});
