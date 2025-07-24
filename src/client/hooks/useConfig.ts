import { once } from 'lodash-es';
import { AppRouterOutput, trpc } from '../api/trpc';
import { anonymousTelemetryUrl } from '../utils/env';
import { useWatch } from './useWatch';
import { useLocalStorageState } from 'ahooks';

const defaultGlobalConfig: AppRouterOutput['global']['config'] = {
  allowRegister: false,
  alphaMode: false,
  disableAnonymousTelemetry: false,
  authProvider: ['email'], // default has email auth to improve login display in saas
  serverTimezone: 'UTC',
  smtpAvailable: false,
  enableBilling: false,
  enableAI: false,
  enableFunctionWorker: false,
};

const callAnonymousTelemetry = once(() => {
  fetch(anonymousTelemetryUrl);
});

let inited = false;
/**
 * Fetch settings from server
 */
export function useGlobalConfig(): AppRouterOutput['global']['config'] {
  const { data } = trpc.global.config.useQuery(undefined, {
    staleTime: 1000 * 60 * 60 * 1, // 1 hour
  });

  const [config, setConfig] = useLocalStorageState<
    AppRouterOutput['global']['config']
  >('tianji-global-config');

  useWatch([data], () => {
    if (data) {
      setConfig(data);
    }

    if (!inited) {
      if (!!data && data.disableAnonymousTelemetry !== true) {
        callAnonymousTelemetry();
      }

      inited = true;
    }
  });

  return config ?? data ?? defaultGlobalConfig;
}
