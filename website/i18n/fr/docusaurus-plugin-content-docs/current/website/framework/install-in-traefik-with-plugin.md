---
sidebar_position: 2
_i18n_hash: f85f95f54fdfadadf81712ccb1401e46
---
# Installer dans Traefik avec un plugin

Tianji propose un plugin Traefik qui vous permet d'intégrer facilement la fonctionnalité d'analyse de site web Tianji dans votre proxy Traefik.

## Aperçu du plugin

[traefik-tianji-plugin](https://github.com/msgbyte/traefik-tianji-plugin) est un plugin de middleware Traefik spécifiquement développé pour Tianji qui peut automatiquement injecter le script de suivi Tianji dans votre site web sans modifier le code de votre site pour commencer à collecter les données des visiteurs.

## Installation du plugin

### 1. Ajouter le plugin dans la configuration statique

Tout d'abord, vous devez ajouter la référence du plugin dans la configuration statique de Traefik. Le numéro de version du plugin fait référence au tag git.

#### Configuration YAML

Ajoutez ce qui suit à votre fichier `traefik.yml` ou fichier de configuration statique :

```yaml
experimental:
  plugins:
    traefik-tianji-plugin:
      moduleName: "github.com/msgbyte/traefik-tianji-plugin"
      version: "v0.2.1"
```

#### Configuration TOML

```toml
[experimental.plugins.traefik-tianji-plugin]
  moduleName = "github.com/msgbyte/traefik-tianji-plugin"
  version = "v0.2.1"
```

#### Ligne de commande

```bash
--experimental.plugins.traefik-tianji-plugin.modulename=github.com/msgbyte/traefik-tianji-plugin
--experimental.plugins.traefik-tianji-plugin.version=v0.2.1
```

### 2. Configurer le Middleware

Après avoir installé le plugin, vous devez configurer le middleware dans la configuration dynamique.

#### Configuration dynamique YAML

Dans votre fichier `config.yml` ou fichier de configuration dynamique :

```yaml
http:
  middlewares:
    my-tianji-middleware:
      plugin:
        traefik-tianji-plugin:
          tianjiHost: "https://tianji.your-domain.com"
          websiteId: "your-website-id"
```

#### Configuration dynamique TOML

```toml
[http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin]
  tianjiHost = "https://tianji.your-domain.com"
  websiteId = "your-website-id"
```

#### Labels Docker Compose

```yaml
version: '3.7'
services:
  my-app:
    image: nginx:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.my-app.rule=Host(`my-app.local`)"
      - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.tianjiHost=https://tianji.your-domain.com"
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.websiteId=your-website-id"
```

## Paramètres de configuration

### Paramètres requis

- **tianjiHost** : URL complète de votre serveur Tianji
  - Exemple : `https://tianji.your-domain.com`
  - Si vous utilisez le service hébergé officiel : `https://app.tianji.dev`

- **websiteId** : L'ID du site web créé dans Tianji
  - Peut être trouvé dans les paramètres du site web de votre panneau d'administration Tianji

### Paramètres optionnels

Le plugin prend également en charge d'autres paramètres de configuration pour personnaliser le comportement. Pour des paramètres spécifiques, veuillez vous référer à la [documentation du dépôt GitHub](https://github.com/msgbyte/traefik-tianji-plugin).

## Utilisation du Middleware

Après la configuration, vous devez utiliser ce middleware dans votre routeur :

### Configuration YAML

```yaml
http:
  routers:
    my-app:
      rule: "Host(`my-app.local`)"
      middlewares:
        - "my-tianji-middleware"
      service: "my-app-service"
```

### Labels Docker Compose

```yaml
labels:
  - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
```

## Comment ça marche

1. Lorsque les requêtes passent par le proxy Traefik, le plugin vérifie le contenu de la réponse
2. Si la réponse est un contenu HTML, le plugin injecte automatiquement le script de suivi Tianji
3. Le script commence à collecter les données des visiteurs et les envoie au serveur Tianji au chargement de la page

## Remarques importantes

- Assurez-vous que l'adresse du serveur Tianji est accessible depuis les navigateurs clients
- L'ID du site web doit être valide, sinon les données ne peuvent pas être collectées correctement
- Le plugin n'entre en jeu que lorsque le type de contenu de la réponse est HTML
- Il est recommandé d'utiliser la dernière version du plugin pour des performances et des fonctionnalités optimales

## Référence

- [Code source du plugin](https://github.com/msgbyte/traefik-tianji-plugin)
- [Documentation du plugin Traefik](https://doc.traefik.io/traefik/plugins/)
