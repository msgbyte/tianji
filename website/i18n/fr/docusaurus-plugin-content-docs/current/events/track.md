---
sidebar_position: 1
_i18n_hash: a3862480440a66a996f471d85570603d
---
# Suivi des Événements

Vous pouvez suivre les actions des utilisateurs sur votre site Web. Tianji fournit un moyen simple de le faire.

## Utilisation de la balise Script

Si vous utilisez une balise de script, il vous suffit d'appeler la fonction `track` à n'importe quel endroit après avoir injecté le script.

```ts
tianji.track(nomÉvénement, données);
```

## Utilisation du SDK

Si vous utilisez le SDK, il vous suffit d'appeler la fonction `reportEvent()` après avoir `initTianjiTracker()`.

```ts
import { initTianjiTracker, reportEvent } from 'tianji-sdk-client';

initTianjiTracker({
  url: urlBackend,
  websiteId,
});
    
reportEvent('Événement Démo', {
  foo: 'bar',
});
```
