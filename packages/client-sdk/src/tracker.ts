import loadScript from 'load-script';

interface InjectTrackerOptions {
  /**
   * your tianji application website
   * @example
   * https://tianji.example.com
   */
  url: string;
  /**
   * Website id, you can get it from your tianji dashboard
   */
  websiteId: string;
  /**
   * If you modify your tracker name with
   */
  customTrackerName?: string;

  /**
   * is auto track route change and dom
   */
  autoTrack?: boolean;

  /**
   * Whitelist domains, default will report all website
   * @example
   * example.com, www.example.com
   */
  domains?: string[];

  disableTrack?: boolean;
}

export async function initTianjiTracker(options: InjectTrackerOptions) {
  const trackerName = options.customTrackerName ?? 'tracker.js';

  const attrs: Record<string, string> = {
    'data-website-id': options.websiteId,
  };

  if (options.autoTrack === false) {
    attrs['data-auto-track'] = 'false';
  }

  if (Array.isArray(options.domains)) {
    attrs['data-domains'] = options.domains.join(',');
  }

  if (options.disableTrack === true) {
    attrs['data-do-not-track'] = 'true';
  }

  return new Promise<void>((resolve, reject) => {
    loadScript(
      `${options.url}/${trackerName}`,
      {
        async: true,
        attrs,
      },
      (err, script) => {
        if (err) {
          reject(err);
          return;
        }

        resolve();
      }
    );
  });
}
