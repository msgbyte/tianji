import { prisma } from './_client';
import bcryptjs from 'bcryptjs';
import { ROLES } from '../utils/const';

async function hashPassword(password: string) {
  return await bcryptjs.hash(password, 10);
}

/**
 * Create User
 */
export async function createAdminUser(username: string, password: string) {
  const count = await prisma.user.count();

  if (count > 0) {
    throw new Error('Create Admin User Just Only allow in non people exist');
  }

  await prisma.user.create({
    data: {
      username,
      password: await hashPassword(password),
      role: ROLES.admin,
      workspaces: {
        create: [
          {
            role: ROLES.owner,
            workspace: {
              create: {
                name: username,
              },
            },
          },
        ],
      },
    },
  });
}

export async function createUser(username: string, password: string) {
  const existCount = await prisma.user.count({
    where: {
      username,
    },
  });

  if (existCount > 0) {
    throw new Error('User already exists');
  }

  await prisma.user.create({
    data: {
      username,
      password: await hashPassword(password),
      role: ROLES.user,
      workspaces: {
        create: [
          {
            role: ROLES.owner,
            workspace: {
              create: {
                name: username,
              },
            },
          },
        ],
      },
    },
  });
}

export async function authUser(username: string, password: string) {
  const user = await prisma.user.findFirstOrThrow({
    where: {
      username,
      password: await hashPassword(password),
    },
    select: {
      id: true,
      username: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      deletedAt: true,
    },
  });

  return user;
}

export async function findUser(userId: string) {
  const user = await prisma.user.findFirst({
    where: {
      id: userId,
    },
    select: {
      id: true,
      username: true,
      role: true,
    },
  });

  return user;
}
