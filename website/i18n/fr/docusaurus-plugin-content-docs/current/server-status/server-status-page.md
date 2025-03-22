---
sidebar_position: 2
_i18n_hash: cecc3b1b7eb92c03797671e2ab259486
---
# Page d'état du serveur

Vous pouvez créer une page d'état du serveur pour montrer l'état de votre serveur au public et informer les autres.

## Configurer un domaine personnalisé

Vous pouvez configurer votre page d'état sur votre propre domaine, par exemple : `status.example.com`

Configurez-le dans la configuration de la page et créez un enregistrement `CNAME` dans votre tableau de bord DNS.

```
CNAME status.example.com tianji.example.com
```

Vous pouvez ensuite visiter le domaine personnalisé `status.example.com` pour accéder à votre page.

### Dépannage

Si vous rencontrez une erreur 500, il semble que votre proxy inverse ne soit pas correctement configuré.

Assurez-vous que votre proxy inverse inclut votre nouvelle route d'état.

par exemple :
```
server {
  listen 80;
  server_name tianji.example.com status.example.com;
  listen 443 ssl;
}
```
