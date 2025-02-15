---
sidebar_position: 1
_i18n_hash: f0ed5671d5832e683b6ba533651a0eb7
---
# Suivi d'Événements

Vous pouvez suivre les actions des utilisateurs sur votre site web. Tianji fournit un moyen simple de le faire.

## Utilisation de la Balise Script

Si vous utilisez une balise script, vous devez simplement appeler la fonction `track` n'importe où après avoir injecté le script.

```ts
tianji.track(eventName, data);
```

## Utilisation du SDK

Si vous utilisez le SDK, vous devez simplement appeler la fonction `reportEvent()` après avoir exécuté `initTianjiTracker()`.

```ts
import { initTianjiTracker, reportEvent } from 'tianji-sdk-client';

initTianjiTracker({
  url: backendUrl,
  websiteId,
});
    
reportEvent('Événement Démo', {
  foo: 'bar',
});
```
