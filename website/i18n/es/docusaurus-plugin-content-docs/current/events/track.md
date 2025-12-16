---
sidebar_position: 1
_i18n_hash: ff4eb3f4ea3a3e6b1f20d9ffb0837623
---
# Seguimiento de Eventos

Puedes rastrear acciones de los usuarios en tu sitio web. Tianji proporciona una manera sencilla de hacerlo.

## Usando la Etiqueta Script

Si estás usando la etiqueta script, solo necesitas llamar a la función `track` en cualquier lugar después de inyectar el script.

```ts
tianji.track(eventName, data);
```

## Usando SDK

Si estás usando el SDK, solo necesitas llamar a la función `reportEvent()` después de `initTianjiTracker()`.

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
