import { AuthConfig } from '@auth/core';
import Nodemailer from '@auth/core/providers/nodemailer';
import Credentials from '@auth/core/providers/credentials';
import { env } from '../utils/env.js';
import { prisma } from './_client.js';
import type { PrismaClient, Prisma, User } from '@prisma/client';
import type {
  Adapter,
  AdapterAccount,
  AdapterSession,
  AdapterUser,
} from '@auth/core/adapters';
import { authUser, createUserWithAuthjs } from './user.js';
import { createTransport } from 'nodemailer';
import { Theme } from '@auth/core/types';
import { generateSMTPHTML } from '../utils/smtp.js';

export const authConfig: Omit<AuthConfig, 'raw'> = {
  debug: true,
  providers: [
    Credentials({
      name: 'Account',
      credentials: {
        username: { label: 'Username' },
        password: { label: 'Password', type: 'password' },
      },
      authorize: async (credentials) => {
        const user = await authUser(
          String(credentials.username),
          String(credentials.password)
        );

        if (!user) {
          // No user found, so this is their first attempt to login
          // meaning this is also the place you could do registration
          throw new Error('User not found.');
        }

        // return user object with the their profile data
        return toAdapterUser(user);
      },
    }),
    Nodemailer({
      name: 'Email',
      ...env.auth.email,
      async sendVerificationRequest(params) {
        const { identifier, url, provider, theme } = params;
        const { host } = new URL(url);
        const transport = createTransport(provider.server);
        const result = await transport.sendMail({
          to: identifier,
          from: provider.from,
          subject: `Sign in Tianji to ${host}`,
          text: `Sign in Tianji to ${host}\n${url}\n\n`,
          html: nodemailHtmlBody({ url, host, theme }),
        });
        const failed = result.rejected.concat(result.pending).filter(Boolean);
        if (failed.length) {
          throw new Error(`Email (${failed.join(', ')}) could not be sent`);
        }
      },
    }),
  ],
  adapter: TianjiPrismaAdapter(prisma),
  secret: env.auth.secret,
};

function toAdapterUser(
  user: Pick<
    User,
    'id' | 'nickname' | 'username' | 'avatar' | 'email' | 'emailVerified'
  >
): AdapterUser {
  return {
    id: user.id,
    name: user.nickname ?? user.username,
    image: user.avatar,
    email: user.email!,
    emailVerified: user.emailVerified,
  };
}

function TianjiPrismaAdapter(
  prisma: PrismaClient | ReturnType<PrismaClient['$extends']>
): Adapter {
  const p = prisma as PrismaClient;

  return {
    // We need to let Prisma generate the ID because our default UUID is incompatible with MongoDB
    createUser: async ({ id: _id, ...data }) => {
      const user = await createUserWithAuthjs(data);

      return toAdapterUser(user);
    },
    getUser: async (id) => {
      const user = await p.user.findUnique({ where: { id } });

      if (!user) {
        return null;
      }

      return toAdapterUser(user);
    },
    getUserByEmail: async (email) => {
      const user = await p.user.findUnique({ where: { email } });

      if (!user) {
        return null;
      }

      return toAdapterUser(user);
    },
    async getUserByAccount(provider_providerAccountId) {
      const account = await p.account.findUnique({
        where: { provider_providerAccountId },
        select: { user: true },
      });
      return (account?.user as AdapterUser) ?? null;
    },
    updateUser: ({ id, ...data }) =>
      p.user.update({ where: { id }, data }) as Promise<AdapterUser>,
    deleteUser: (id) =>
      p.user.delete({ where: { id } }) as Promise<AdapterUser>,
    linkAccount: (data) =>
      p.account.create({ data }) as unknown as AdapterAccount,
    unlinkAccount: (provider_providerAccountId) =>
      p.account.delete({
        where: { provider_providerAccountId },
      }) as unknown as AdapterAccount,
    async getSessionAndUser(sessionToken) {
      const userAndSession = await p.session.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      if (!userAndSession) return null;
      const { user, ...session } = userAndSession;
      return { user, session } as {
        user: AdapterUser;
        session: AdapterSession;
      };
    },
    createSession: (data) => p.session.create({ data }),
    updateSession: (data) =>
      p.session.update({ where: { sessionToken: data.sessionToken }, data }),
    deleteSession: (sessionToken) =>
      p.session.delete({ where: { sessionToken } }),
    async createVerificationToken(data) {
      const verificationToken = await p.verificationToken.create({ data });
      // @ts-expect-errors // MongoDB needs an ID, but we don't
      if (verificationToken.id) delete verificationToken.id;
      return verificationToken;
    },
    async useVerificationToken(identifier_token) {
      try {
        const verificationToken = await p.verificationToken.delete({
          where: { identifier_token },
        });
        // @ts-expect-errors // MongoDB needs an ID, but we don't
        if (verificationToken.id) delete verificationToken.id;
        return verificationToken;
      } catch (error) {
        // If token already used/deleted, just return null
        // https://www.prisma.io/docs/reference/api-reference/error-reference#p2025
        if ((error as Prisma.PrismaClientKnownRequestError).code === 'P2025')
          return null;
        throw error;
      }
    },
    async getAccount(providerAccountId, provider) {
      return p.account.findFirst({
        where: { providerAccountId, provider },
      }) as Promise<AdapterAccount | null>;
    },
    // async createAuthenticator(authenticator) {
    //   return p.authenticator.create({
    //     data: authenticator,
    //   });
    // },
    // async getAuthenticator(credentialID) {
    //   return p.authenticator.findUnique({
    //     where: { credentialID },
    //   });
    // },
    // async listAuthenticatorsByUserId(userId) {
    //   return p.authenticator.findMany({
    //     where: { userId },
    //   });
    // },
    // async updateAuthenticatorCounter(credentialID, counter) {
    //   return p.authenticator.update({
    //     where: { credentialID },
    //     data: { counter },
    //   });
    // },
  };
}

function nodemailHtmlBody(params: { url: string; host: string; theme: Theme }) {
  const { url, host, theme } = params;

  const escapedHost = host.replace(/\./g, '&#8203;.');

  const brandColor = theme.brandColor || '#346df1';
  const color = {
    background: '#f9f9f9',
    text: '#444',
    mainBackground: '#fff',
    buttonBackground: brandColor,
    buttonBorder: brandColor,
    buttonText: theme.buttonText || '#fff',
  };

  const body = `
<body style="background: ${color.background};">
  <table width="100%" border="0" cellspacing="20" cellpadding="0"
    style="background: ${color.mainBackground}; max-width: 600px; margin: auto; border-radius: 10px;">
    <tr>
      <td align="center"
        style="padding: 10px 0px; font-size: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        Sign in Tianji to <strong>${escapedHost}</strong>
      </td>
    </tr>
    <tr>
      <td align="center" style="padding: 20px 0;">
        <table border="0" cellspacing="0" cellpadding="0">
          <tr>
            <td align="center" style="border-radius: 5px;" bgcolor="${color.buttonBackground}"><a href="${url}"
                target="_blank"
                style="font-size: 18px; font-family: Helvetica, Arial, sans-serif; color: ${color.buttonText}; text-decoration: none; border-radius: 5px; padding: 10px 20px; border: 1px solid ${color.buttonBorder}; display: inline-block; font-weight: bold;">Sign
                in</a></td>
          </tr>
        </table>
      </td>
    </tr>
    <tr>
      <td align="center"
        style="padding: 0px 0px 10px 0px; font-size: 16px; line-height: 22px; font-family: Helvetica, Arial, sans-serif; color: ${color.text};">
        If you did not request this email you can safely ignore it.
      </td>
    </tr>
  </table>
</body>
`;

  return generateSMTPHTML(body);
}
