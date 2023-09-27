import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/trpc';
import { httpBatchLink, TRPCClientErrorLike } from '@trpc/client';
import { getJWT } from './auth';
import { message } from 'antd';

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

/**
 * @usage
 * trpc.<action>.useMutation({
 *   onSuccess: defaultSuccessHandler,
 * });
 */
export function defaultSuccessHandler(data: any) {
  message.success('Operate Success');
}

/**
 * @usage
 * trpc.<action>.useMutation({
 *   onError: defaultErrorHandler,
 * });
 */
export function defaultErrorHandler(error: TRPCClientErrorLike<any>) {
  message.error(error.message);
}
