---
sidebar_position: 2
_i18n_hash: 8142a07cc46361e9e72d8c883ab7869a
---
# Installer dans Traefik avec le plugin

Tianji fournit un plugin Traefik qui vous permet d'intégrer facilement la fonctionnalité d'analyse de site Web Tianji dans votre proxy Traefik.

## Aperçu du Plugin

[traefik-tianji-plugin](https://github.com/msgbyte/traefik-tianji-plugin) est un plugin de middleware Traefik spécifiquement développé pour Tianji qui peut automatiquement injecter le script de suivi Tianji dans votre site Web sans modifier votre code, afin de commencer à collecter des données sur les visiteurs.

## Installation du Plugin

### 1. Ajouter le Plugin dans la Configuration Statique

Tout d'abord, vous devez ajouter la référence du plugin dans la configuration statique de Traefik. Le numéro de version du plugin fait référence à la balise git.

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

#### Configuration Dynamique YAML

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

#### Configuration Dynamique TOML

```toml
[http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin]
  tianjiHost = "https://tianji.your-domain.com"
  websiteId = "your-website-id"
```

#### Étiquettes Docker Compose

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

## Paramètres de Configuration

### Paramètres Requis

- **tianjiHost** : L'URL complète de votre serveur Tianji
  - Exemple : `https://tianji.your-domain.com`
  - Si vous utilisez le service hébergé officiel : `https://app-tianji.msgbyte.com`

- **websiteId** : L'ID du site Web créé dans Tianji
  - Peut être trouvé dans les paramètres du site Web de votre panneau d'administration Tianji

### Paramètres Optionnels

Le plugin prend également en charge d'autres paramètres de configuration pour personnaliser le comportement. Pour des paramètres spécifiques, veuillez vous référer à la [documentation du référentiel GitHub](https://github.com/msgbyte/traefik-tianji-plugin).

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

### Étiquettes Docker Compose

```yaml
labels:
  - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
```

## Comment Ça Fonctionne

1. Lorsque des requêtes passent par le proxy Traefik, le plugin vérifie le contenu de la réponse
2. Si la réponse est un contenu HTML, le plugin injecte automatiquement le script de suivi Tianji
3. Le script commence à collecter des données sur les visiteurs et les envoie au serveur Tianji lorsque la page se charge

## Notes Importantes

- Assurez-vous que l'adresse du serveur Tianji est accessible depuis les navigateurs des clients
- L'ID du site Web doit être valide, sinon les données ne peuvent pas être correctement collectées
- Le plugin ne prend effet que lorsque le type de contenu de la réponse est HTML
- Il est recommandé d'utiliser la dernière version du plugin pour des performances et des fonctionnalités optimales

## Référence

- [Code Source du Plugin](https://github.com/msgbyte/traefik-tianji-plugin)
- [Documentation du Plugin Traefik](https://doc.traefik.io/traefik/plugins/)
