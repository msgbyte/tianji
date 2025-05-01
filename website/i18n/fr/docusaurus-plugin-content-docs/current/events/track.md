---
sidebar_position: 1
_i18n_hash: ff4eb3f4ea3a3e6b1f20d9ffb0837623
---
# Suivi des événements

Vous pouvez suivre les actions des utilisateurs sur votre site web. Tianji offre une méthode simple pour le faire.

## Utilisation de la balise Script

Si vous utilisez la balise script, vous n'avez besoin que d'appeler la fonction `track` n'importe où après avoir injecté le script.

```ts
tianji.track(eventName, data);
```

## Utilisation du SDK

Si vous utilisez le SDK, vous devez simplement appeler la fonction `reportEvent()` après avoir initialisé `initTianjiTracker()`.

```ts
import { initTianjiTracker, reportEvent } from 'tianji-client-sdk';

initTianjiTracker({
  url: backendUrl,
  websiteId,
});
    
reportEvent('Événement Démonstration', {
  foo: 'bar',
});
```
