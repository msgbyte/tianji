---
sidebar_position: 2
_i18n_hash: 7ce5eca3bf7af802db48c3db37d996f5
---
# Page d'état du serveur

Vous pouvez créer une page d'état du serveur pour montrer l'état de votre serveur au public.

## Configurer un domaine personnalisé

Vous pouvez configurer votre page d'état sur votre propre domaine, par exemple : `status.example.com`

Configurez-le dans les paramètres de la page et créez un enregistrement `CNAME` dans votre tableau de bord DNS.

```
CNAME status.example.com tianji.example.com
```

Ensuite, vous pouvez visiter `status.example.com` pour accéder à votre page.
