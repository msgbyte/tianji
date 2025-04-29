---
sidebar_position: 1
---

# Event Tracking

You can track user actions on your website. Tianji provides a simple way to do that.

## Using Script Tag

if you are using script tag, you just need to call `track` function in any where after you inject script

```ts
tianji.track(eventName, data);
```

## Using SDK

if you are using sdk, you just need to call `reportEvent()` function after you `initTianjiTracker()`

```ts
import { initTianjiTracker, reportEvent } from 'tianji-client-sdk';

initTianjiTracker({
  url: backendUrl,
  websiteId,
});
    
reportEvent('Demo Event', {
  foo: 'bar',
});
```
