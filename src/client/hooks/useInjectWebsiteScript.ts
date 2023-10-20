import { useGlobalConfig } from './useConfig';
import { useDataReady } from './useDataReady';

export function useInjectWebsiteScript() {
  const { websiteId } = useGlobalConfig();

  useDataReady(
    () => typeof websiteId === 'string' && websiteId.length > 0,
    () => {
      const el = document.createElement('script');
      el.src = location.origin + '/tracker.js';
      el.setAttribute('data-website-id', String(websiteId));
      document.head.append(el);
    }
  );
}
