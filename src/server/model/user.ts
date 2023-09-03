import { prisma } from './_client';
import bcryptjs from 'bcryptjs';
import { ROLES } from '../utils/const';
import { jwtVerify } from '../middleware/auth';

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
};

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

  let user = await prisma.user.create({
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
    select: createUserSelect,
  });

  if (user.workspaces[0]) {
    user = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        currentWorkspaceId: user.workspaces[0].workspace.id,
      },
      select: createUserSelect,
    });
  }

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

  let user = await prisma.user.create({
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
    select: createUserSelect,
  });

  if (user.workspaces[0]) {
    user = await prisma.user.update({
      where: {
        id: user.id,
      },
      data: {
        currentWorkspaceId: user.workspaces[0].workspace.id,
      },
      select: createUserSelect,
    });
  }

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
