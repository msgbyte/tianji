import { AppRouterOutput, trpc } from '../api/trpc';

const defaultGlobalConfig: AppRouterOutput['global']['config'] = {
  allowRegister: false,
};

/**
 * Fetch settings from server
 */
export function useGlobalConfig(): AppRouterOutput['global']['config'] {
  const { data = defaultGlobalConfig } = trpc.global.config.useQuery(
    undefined,
    {
      staleTime: 1000 * 60 * 60 * 1, // 1 hour
    }
  );

  return data;
}
