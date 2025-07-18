/**
 * Fork from https://github.com/umami-software/umami/blob/master/src/tracker/index.js
 */

((window) => {
  const {
    screen: { width, height },
    navigator: { language },
    location,
    localStorage,
    document,
    history,
  } = window;
  const { hostname, pathname, search } = location;
  const { currentScript } = document;

  if (!currentScript) {
    return;
  }

  const _data = 'data-';
  const _false = 'false';
  const attr = currentScript.getAttribute.bind(currentScript);
  const website = attr(_data + 'website-id');
  const hostUrl = attr(_data + 'host-url');
  const autoTrack = attr(_data + 'auto-track') !== _false;
  const dnt = attr(_data + 'do-not-track');
  const domain = attr(_data + 'domains') || '';
  const domains = domain.split(',').map((n) => n.trim());
  const root = hostUrl
    ? hostUrl.replace(/\/$/, '')
    : (currentScript as any).src.split('/').slice(0, -1).join('/');
  const endpoint = `${root}/api/website/send`;
  const screen = `${width}x${height}`;
  const eventRegex = /data-tianji-event-([\w-_]+)/;
  const eventNameAttribute = _data + 'tianji-event';
  const delayDuration = 300;

  /* Helper functions */

  const hook = (_this: any, method: string, callback: any) => {
    const orig = _this[method];

    return (...args: any[]) => {
      callback.apply(null, args);

      return orig.apply(_this, args);
    };
  };

  const getPath = (url: string) => {
    try {
      return new URL(url).pathname;
    } catch (e) {
      return url;
    }
  };

  const getPayload = () => ({
    website,
    hostname,
    screen,
    language,
    title,
    url: currentUrl,
    referrer: currentRef,
  });

  /* Tracking functions */

  const doNotTrack = () => {
    const { doNotTrack, navigator, external } = window as any;

    const msTrackProtection = 'msTrackingProtectionEnabled';
    const msTracking = () => {
      return (
        external &&
        msTrackProtection in external &&
        external[msTrackProtection]()
      );
    };

    const dnt =
      doNotTrack ||
      navigator.doNotTrack ||
      navigator.msDoNotTrack ||
      msTracking();

    return dnt == '1' || dnt === 'yes';
  };

  const trackingDisabled = () =>
    (localStorage && localStorage.getItem('tianji.disabled')) ||
    (dnt && doNotTrack()) ||
    (domain && !domains.includes(hostname));

  const handlePush = (state: any, title: any, url: any) => {
    if (!url) return;

    currentRef = currentUrl;
    currentUrl = getPath(url.toString());

    if (currentUrl !== currentRef) {
      setTimeout(track, delayDuration);
    }
  };

  const handleClick = () => {
    const trackElement = (el: any) => {
      const attr = el.getAttribute.bind(el);
      const eventName = attr(eventNameAttribute);

      if (eventName) {
        const eventData: any = {};

        el.getAttributeNames().forEach((name: any) => {
          const match = name.match(eventRegex);

          if (match) {
            eventData[match[1]] = attr(name);
          }
        });

        return track(eventName, eventData);
      }
      return Promise.resolve();
    };

    const callback = (e: any) => {
      const findATagParent = (rootElem: any, maxSearchDepth: any) => {
        let currentElement = rootElem;
        for (let i = 0; i < maxSearchDepth; i++) {
          if (currentElement.tagName === 'A') {
            return currentElement;
          }
          currentElement = currentElement.parentElement;
          if (!currentElement) {
            return null;
          }
        }
        return null;
      };

      const el = e.target;
      const anchor = el.tagName === 'A' ? el : findATagParent(el, 10);

      if (anchor) {
        const { href, target } = anchor;
        const external =
          target === '_blank' ||
          e.ctrlKey ||
          e.shiftKey ||
          e.metaKey ||
          (e.button && e.button === 1);
        const eventName = anchor.getAttribute(eventNameAttribute);

        if (eventName && href) {
          if (!external) {
            e.preventDefault();
          }
          trackElement(anchor)?.then(() => {
            if (!external) location.href = href;
          });
        }
      } else {
        trackElement(el);
      }
    };

    document.addEventListener('click', callback, true);
  };

  const observeTitle = () => {
    const callback = ([entry]: any) => {
      title = entry && entry.target ? entry.target.text : undefined;
    };

    const observer = new MutationObserver(callback);

    const node = document.querySelector('head > title');

    if (node) {
      observer.observe(node, {
        subtree: true,
        characterData: true,
        childList: true,
      });
    }
  };

  const send = (payload: any, type = 'event') => {
    if (trackingDisabled()) {
      return;
    }
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (typeof cache !== 'undefined') {
      headers['x-tianji-cache'] = cache;
    }
    return fetch(endpoint, {
      method: 'POST',
      body: JSON.stringify({ type, payload }),
      headers,
    })
      .then((res) => res.text())
      .then((text) => (cache = text))
      .catch(() => {});
  };

  const track = (obj?: any, data?: any) => {
    if (typeof obj === 'string') {
      return send({
        ...getPayload(),
        name: obj,
        data: typeof data === 'object' ? data : undefined,
      });
    } else if (typeof obj === 'object') {
      return send(obj);
    } else if (typeof obj === 'function') {
      return send(obj(getPayload()));
    }
    return send(getPayload());
  };

  const identify = (data: any) => send({ ...getPayload(), data }, 'identify');

  /* Start */

  if (!(window as any).tianji) {
    (window as any).tianji = {
      track,
      identify,
    };
  }

  let currentUrl = `${pathname}${search}`;
  let currentRef = document.referrer;
  let title = document.title;
  let cache: any;
  let initialized: any;

  if (autoTrack && !trackingDisabled()) {
    history.pushState = hook(history, 'pushState', handlePush);
    history.replaceState = hook(history, 'replaceState', handlePush);
    handleClick();
    observeTitle();

    const init = () => {
      if (document.readyState === 'complete' && !initialized) {
        track();
        initialized = true;
      }
    };

    document.addEventListener('readystatechange', init, true);

    init();
  }
})(window);
