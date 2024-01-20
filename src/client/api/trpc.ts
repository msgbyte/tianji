import { createTRPCReact, getQueryKey } from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '../../server/trpc';
import type { AppRouter } from '../../server/trpc/routers';
import { httpBatchLink, loggerLink, TRPCClientErrorLike } from '@trpc/client';
import { getJWT } from './auth';
import { message } from 'antd';
import { isDev } from '../utils/env';

export { getQueryKey };

export const trpc = createTRPCReact<AppRouter>();

export type AppRouterInput = inferRouterInputs<AppRouter>;
export type AppRouterOutput = inferRouterOutputs<AppRouter>;

export const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: (opts) =>
        (isDev && typeof window !== 'undefined') ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
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
export function defaultSuccessHandler() {
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
