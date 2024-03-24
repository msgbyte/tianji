import supertest from 'supertest';
import { afterAll } from 'vitest';
import { app } from '../app';
import { prisma } from '../model/_client';
import { PrismaPromise } from '@prisma/client';
import { createUser } from '../model/user';
import { nanoid } from 'nanoid';

export function createTestContext() {
  const testDataCallback: (() => PrismaPromise<any> | Promise<any>)[] = [];

  afterAll(async () => {
    for (const cb of testDataCallback.reverse()) {
      await cb();
    }
  });

  const createTestUser = async () => {
    const data = await createUser(nanoid(), '');

    testDataCallback.push(async () => {
      await prisma.user.delete({
        where: { id: data.id },
      });

      await prisma.workspace.delete({
        where: { id: data.currentWorkspace.id },
      });
    });

    return {
      user: data,
      workspace: data.currentWorkspace,
    };
  };

  const createTestWorkspace = async () => {
    const data = await prisma.workspace.create({
      data: {
        name: 'Test Workspace',
      },
    });

    testDataCallback.push(() =>
      prisma.workspace.delete({
        where: { id: data.id },
      })
    );

    return data;
  };

  const createTestTelemetry = async (workspaceId: string) => {
    const data = await prisma.telemetry.create({
      data: {
        name: 'Test Telemetry',
        workspaceId,
      },
    });

    testDataCallback.push(() =>
      prisma.telemetry.delete({
        where: { id: data.id },
      })
    );

    return data;
  };

  return {
    app: supertest(app),
    createTestUser,
    createTestWorkspace,
    createTestTelemetry,
  };
}
