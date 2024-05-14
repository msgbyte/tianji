import { AuthConfig } from '@auth/core';
import Nodemailer from '@auth/core/providers/nodemailer';
import { env } from '../utils/env';

export const authConfig: Omit<AuthConfig, 'raw'> = {
  providers: [Nodemailer],
  secret: env.auth.secret,
};
