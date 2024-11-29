import { once } from 'lodash-es';
import { AppRouterOutput, trpc } from '../api/trpc';
import { anonymousTelemetryUrl } from '../utils/env';

const defaultGlobalConfig: AppRouterOutput['global']['config'] = {
  allowRegister: false,
  alphaMode: false,
  disableAnonymousTelemetry: false,
  authProvider: ['email'], // default has email auth to improve login display in saas
  enableBilling: false,
};

const callAnonymousTelemetry = once(() => {
  fetch(anonymousTelemetryUrl);
});

/**
 * Fetch settings from server
 */
export function useGlobalConfig(): AppRouterOutput['global']['config'] {
  const { data = defaultGlobalConfig } = trpc.global.config.useQuery(
    undefined,
    {
      staleTime: 1000 * 60 * 60 * 1, // 1 hour
      onSuccess(data) {
        /**
         * Call anonymous telemetry if not disabled
         */
        if (data.disableAnonymousTelemetry !== true) {
          callAnonymousTelemetry();
        }
      },
    }
  );

  return data;
}
