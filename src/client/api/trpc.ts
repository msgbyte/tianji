import { createTRPCReact, getQueryKey } from '@trpc/react-query';
import type { inferRouterInputs, inferRouterOutputs } from '../../server/trpc';
import type { AppRouter } from '../../server/trpc/routers';
import {
  httpBatchLink,
  httpLink,
  loggerLink,
  splitLink,
  TRPCClientErrorLike,
  unstable_httpBatchStreamLink,
  createTRPCClientProxy,
} from '@trpc/client';
import { message } from 'antd';
import { isDev } from '../utils/env';
import { getUserTimezone } from './model/user';

export { getQueryKey };

export const trpc = createTRPCReact<AppRouter>();

export type AppRouterInput = inferRouterInputs<AppRouter>;
export type AppRouterOutput = inferRouterOutputs<AppRouter>;

const url = '/trpc';

function headers() {
  const timezone = getUserTimezone();
  const origin = typeof window !== 'undefined' ? window.location.origin : '';

  return {
    timezone,
    origin,
  };
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
        return op.context.stream === true;
      },
      true: unstable_httpBatchStreamLink({
        url: url,
        headers,
      }),
      false: splitLink({
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
          maxURLLength: 2083,
        }),
      }),
    }),
  ],
});

// export const trpcClientProxy = createTRPCClientProxy<AppRouter>(trpcClient);

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
