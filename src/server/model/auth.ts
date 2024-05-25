import { AuthConfig } from '@auth/core';
import Nodemailer from '@auth/core/providers/nodemailer';
import { env } from '../utils/env';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './_client';

export const authConfig: Omit<AuthConfig, 'raw'> = {
  providers: [Nodemailer(env.auth.email)],
  adapter: PrismaAdapter(prisma),
  secret: env.auth.secret,
};
