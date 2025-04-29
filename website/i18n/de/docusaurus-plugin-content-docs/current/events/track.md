---
sidebar_position: 1
_i18n_hash: f0ed5671d5832e683b6ba533651a0eb7
---
# Ereignisverfolgung

Sie können Benutzeraktionen auf Ihrer Website verfolgen. Tianji bietet eine einfache Möglichkeit, dies zu tun.

## Verwendung des Script-Tags

Wenn Sie das Script-Tag verwenden, müssen Sie einfach die `track`-Funktion an irgendeiner Stelle aufrufen, nachdem Sie das Skript eingefügt haben.

```ts
tianji.track(eventName, data);
```

## Verwendung des SDK

Wenn Sie das SDK verwenden, müssen Sie einfach die `reportEvent()`-Funktion aufrufen, nachdem Sie `initTianjiTracker()` ausgeführt haben.

```ts
import { initTianjiTracker, reportEvent } from 'tianji-client-sdk';

initTianjiTracker({
  url: backendUrl,
  websiteId,
});
    
reportEvent('Demo-Ereignis', {
  foo: 'bar',
});
```
