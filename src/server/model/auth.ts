import { AuthConfig } from '@auth/core';
import Nodemailer from '@auth/core/providers/nodemailer';
import { env } from '../utils/env.js';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from './_client.js';

export const authConfig: Omit<AuthConfig, 'raw'> = {
  providers: [Nodemailer(env.auth.email)],
  adapter: PrismaAdapter(prisma),
  secret: env.auth.secret,
};
