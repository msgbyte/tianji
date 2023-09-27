import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/trpc';
import { httpBatchLink } from '@trpc/client';
import { getJWT } from './auth';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: '/trpc',
      async headers() {
        return {
          Authorization: `Bearer ${getJWT()}`,
        };
      },
    }),
  ],
});
