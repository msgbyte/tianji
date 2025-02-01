---
sidebar_position: 1
_i18n_hash: a3862480440a66a996f471d85570603d
---
# Ereignisverfolgung

Sie können Benutzeraktionen auf Ihrer Website verfolgen. Tianji bietet eine einfache Möglichkeit, dies zu tun.

## Verwendung des Skript-Tags

Wenn Sie das Skript-Tag verwenden, müssen Sie einfach die `track`-Funktion an beliebiger Stelle nach dem Einfügen des Skripts aufrufen.

```ts
tianji.track(eventName, data);
```

## Verwendung des SDK

Wenn Sie das SDK verwenden, müssen Sie einfach die Funktion `reportEvent()` aufrufen, nachdem Sie `initTianjiTracker()` aufgerufen haben.

```ts
import { initTianjiTracker, reportEvent } from 'tianji-sdk-client';

initTianjiTracker({
  url: backendUrl,
  websiteId,
});
    
reportEvent('Demo-Event', {
  foo: 'bar',
});
```
