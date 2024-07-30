import type { DefaultSession, User, DefaultJWT } from '@auth/express';
import type { SYSTEM_ROLES } from '@tianji/shared';

declare module '@auth/express' {
  interface Session extends DefaultSession {
    user: {
      id: string;
      name: string;
      email: string;
      image: string;
      role: SYSTEM_ROLES;
    };
  }

  export interface JWT {
    role: SYSTEM_ROLES;
  }
}
