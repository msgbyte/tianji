import { prisma } from './_client';
import bcryptjs from 'bcryptjs';

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
      role: 'admin',
    },
  });
}

export async function createUser(username: string, password: string) {
  await prisma.user.create({
    data: {
      username,
      password: await hashPassword(password),
      role: 'normal',
    },
  });
}

export async function authUser(username: string, password: string) {
  const user = await prisma.user.findFirstOrThrow({
    where: {
      username,
      password: await hashPassword(password),
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
