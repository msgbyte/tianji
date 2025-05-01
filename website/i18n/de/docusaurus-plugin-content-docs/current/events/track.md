---
sidebar_position: 1
_i18n_hash: ff4eb3f4ea3a3e6b1f20d9ffb0837623
---
# Ereignisverfolgung

Sie können Benutzeraktionen auf Ihrer Website verfolgen. Tianji bietet eine einfache Möglichkeit, dies zu tun.

## Verwendung des Skript-Tags

Wenn Sie das Skript-Tag verwenden, müssen Sie lediglich die `track`-Funktion an beliebiger Stelle aufrufen, nachdem Sie das Skript eingefügt haben.

```ts
tianji.track(eventName, data);
```

## Verwendung des SDK

Wenn Sie das SDK verwenden, müssen Sie lediglich die `reportEvent()`-Funktion aufrufen, nachdem Sie `initTianjiTracker()` ausgeführt haben.

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
