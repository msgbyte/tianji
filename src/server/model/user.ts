import { prisma } from './_client.js';
import bcryptjs from 'bcryptjs';
import { ROLES, SYSTEM_ROLES } from '@tianji/shared';
import { jwtVerify } from '../middleware/auth.js';
import { TRPCError } from '@trpc/server';
import { Prisma } from '@prisma/client';

async function hashPassword(password: string) {
  return await bcryptjs.hash(password, 10);
}

function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcryptjs.compare(password, hash);
}

export async function getUserCount(): Promise<number> {
  const count = await prisma.user.count();

  return count;
}

const createUserSelect = {
  id: true,
  username: true,
  role: true,
  createdAt: true,
  updatedAt: true,
  deletedAt: true,
  currentWorkspace: {
    select: {
      id: true,
      name: true,
      dashboardOrder: true,
      dashboardLayout: true,
    },
  },
  workspaces: {
    select: {
      role: true,
      workspace: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.UserSelect;

/**
 * Create User
 */
export async function createAdminUser(username: string, password: string) {
  const count = await prisma.user.count();

  if (count > 0) {
    throw new Error(
      'Create Admin User Just Only allow in non people exist, you can Grant Privilege with admin user'
    );
  }

  const user = await prisma.$transaction(async (p) => {
    const newWorkspace = await p.workspace.create({
      data: {
        name: username,
      },
    });

    const user = await p.user.create({
      data: {
        username,
        password: await hashPassword(password),
        role: SYSTEM_ROLES.admin,
        workspaces: {
          create: [
            {
              role: ROLES.owner,
              workspaceId: newWorkspace.id,
            },
          ],
        },
        currentWorkspaceId: newWorkspace.id,
      },
      select: createUserSelect,
    });

    return user;
  });

  return user;
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

  const user = await prisma.$transaction(async (p) => {
    const newWorkspace = await p.workspace.create({
      data: {
        name: username,
      },
    });

    const user = await p.user.create({
      data: {
        username,
        password: await hashPassword(password),
        role: SYSTEM_ROLES.user,
        workspaces: {
          create: [
            {
              role: ROLES.owner,
              workspaceId: newWorkspace.id,
            },
          ],
        },
        currentWorkspaceId: newWorkspace.id,
      },
      select: createUserSelect,
    });

    return user;
  });

  return user;
}

export async function authUser(username: string, password: string) {
  const user = await prisma.user.findUnique({
    where: {
      username,
    },
    select: { ...createUserSelect, password: true },
  });

  if (!user) {
    throw new Error('User not existed');
  }

  const checkPassword = await comparePassword(password, user.password);
  if (!checkPassword) {
    throw new Error('Password incorrected');
  }

  delete (user as any)['password'];

  return user;
}

export async function authUserWithToken(token: string) {
  const payload = jwtVerify(token);

  const id = payload.id;

  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id,
    },
    select: createUserSelect,
  });

  return user;
}

export async function findUser(userId: string) {
  const user = await prisma.user.findUnique({
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

export async function changeUserPassword(
  userId: string,
  oldPassword: string,
  newPassword: string
) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!user) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'user not found',
    });
  }

  const checkPassword = await comparePassword(oldPassword, user.password);
  if (!checkPassword) {
    throw new TRPCError({
      code: 'INTERNAL_SERVER_ERROR',
      message: 'old password not correct',
    });
  }

  return prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: await hashPassword(newPassword),
    },
  });
}
