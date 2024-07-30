import { createTRPCReact, getQueryKey } from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '../../server/trpc';
import type { AppRouter } from '../../server/trpc/routers';
import {
  httpBatchLink,
  httpLink,
  loggerLink,
  splitLink,
  TRPCClientErrorLike,
} from '@trpc/client';
import { getJWT } from './authjs';
import { message } from 'antd';
import { isDev } from '../utils/env';

export { getQueryKey };

export const trpc = createTRPCReact<AppRouter>();

export type AppRouterInput = inferRouterInputs<AppRouter>;
export type AppRouterOutput = inferRouterOutputs<AppRouter>;

const url = '/trpc';

function headers() {
  const jwt = getJWT();
  if (jwt) {
    return {
      Authorization: `Bearer ${getJWT()}`,
    };
  }

  return {};
}

export const trpcClient = trpc.createClient({
  links: [
    loggerLink({
      enabled: (opts) =>
        (isDev && typeof window !== 'undefined') ||
        (opts.direction === 'down' && opts.result instanceof Error),
    }),
    splitLink({
      condition(op) {
        // check for context property `skipBatch`
        return op.context.skipBatch === true;
      },
      true: httpLink({
        url,
        headers,
      }),
      // when condition is false, use batching
      false: httpBatchLink({
        url,
        headers,
      }),
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
