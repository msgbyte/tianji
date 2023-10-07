import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from '../../server/trpc/routers';
import { httpBatchLink, TRPCClientErrorLike } from '@trpc/client';
import { getJWT } from './auth';
import { message } from 'antd';
import type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export const trpc = createTRPCReact<AppRouter>();

export type RouterInput = inferRouterInputs<AppRouter>;
export type RouterOutput = inferRouterOutputs<AppRouter>;

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
