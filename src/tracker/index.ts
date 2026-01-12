/**
 * Tianji Website Tracker (IIFE version)
 * Fork from https://github.com/umami-software/umami/blob/master/src/tracker/index.js
 * Now uses shared core from tianji-client-sdk
 */

import { createTrackerCore } from 'tianji-client-sdk/tracker/core';

((window) => {
  const { location, localStorage, document, history } = window;
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
    const dntValue =
      doNotTrack ||
      navigator.doNotTrack ||
      navigator.msDoNotTrack ||
      msTracking();
    return dntValue == '1' || dntValue === 'yes';
  };

  const trackingDisabled = () =>
    (localStorage && localStorage.getItem('tianji.disabled')) ||
    (dnt && doNotTrack()) ||
    (domain && !domains.includes(hostname));

  if (!website || trackingDisabled()) {
    return;
  }

  // Initialize tracker core with batch mode
  const tracker = createTrackerCore({
    serverUrl: root,
    websiteId: website,
    batchDelay: 200,
    disableBatch: false,
  });

  let currentUrl = `${pathname}${search}`;
  let currentRef = document.referrer;
  let title = document.title;
  let initialized = false;

  const track = (
    eventNameOrPayload?: string | { name?: string; data?: Record<string, any> },
    eventData?: Record<string, any>
  ) => {
    if (trackingDisabled()) return;

    let name: string | undefined;
    let data: Record<string, any> | undefined;

    if (typeof eventNameOrPayload === 'object' && eventNameOrPayload !== null) {
      name = eventNameOrPayload.name;
      data = eventNameOrPayload.data;
    } else {
      name = eventNameOrPayload;
      data = eventData;
    }

    const payload = tracker.getPayload({
      title,
      url: currentUrl,
      referrer: currentRef,
      name,
      data,
    });

    tracker.track(payload.name, payload.data);
  };

  const identify = (data: Record<string, any>) => {
    if (trackingDisabled()) return;
    tracker.identify(data);
  };

  const handlePush = (state: any, titleArg: any, url: any) => {
    if (!url) return;
    currentRef = currentUrl;
    currentUrl = getPath(url.toString());
    if (currentUrl !== currentRef) {
      setTimeout(() => track(), delayDuration);
    }
  };

  const handleClick = () => {
    const trackElement = (el: any) => {
      const attrFn = el.getAttribute.bind(el);
      const eventName = attrFn(eventNameAttribute);

      if (eventName) {
        const eventData: any = {};
        el.getAttributeNames().forEach((name: any) => {
          const match = name.match(eventRegex);
          if (match) {
            eventData[match[1]] = attrFn(name);
          }
        });
        track(eventName, eventData);
        return true;
      }
      return false;
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
          trackElement(anchor);
          if (!external) {
            setTimeout(() => {
              location.href = href;
            }, 100);
          }
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

  // Flush batch on page unload
  const handleUnload = () => {
    tracker.flush();
  };

  /* Expose API */
  if (!(window as any).tianji) {
    (window as any).tianji = {
      track,
      identify,
    };
  }

  /* Start auto tracking */
  if (autoTrack) {
    history.pushState = hook(history, 'pushState', handlePush);
    history.replaceState = hook(history, 'replaceState', handlePush);
    handleClick();
    observeTitle();

    window.addEventListener('beforeunload', handleUnload);
    window.addEventListener('pagehide', handleUnload);

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
