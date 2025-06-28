---
sidebar_position: 2
_i18n_hash: 8142a07cc46361e9e72d8c883ab7869a
---
# Installation dans Traefik avec plugin

Tianji fournit un plugin Traefik qui vous permet d'intégrer facilement la fonctionnalité d'analyse de site Web Tianji dans votre proxy Traefik.

## Aperçu du Plugin

[traefik-tianji-plugin](https://github.com/msgbyte/traefik-tianji-plugin) est un plugin middleware Traefik spécifiquement développé pour Tianji qui peut automatiquement injecter le script de suivi Tianji dans votre site Web sans modifier le code de votre site afin de commencer à collecter des données de visiteurs.

## Installation du Plugin

### 1. Ajouter le Plugin dans la Configuration Statique

Tout d'abord, vous devez ajouter la référence du plugin dans la configuration statique de Traefik. Le numéro de version du plugin fait référence au tag git.

#### Configuration YAML

Ajoutez ce qui suit à votre `traefik.yml` ou fichier de configuration statique :

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

#### Ligne de Commande

```bash
--experimental.plugins.traefik-tianji-plugin.modulename=github.com/msgbyte/traefik-tianji-plugin
--experimental.plugins.traefik-tianji-plugin.version=v0.2.1
```

### 2. Configurer le Middleware

Après avoir installé le plugin, vous devez configurer le middleware dans la configuration dynamique.

#### Configuration Dynamique YAML

Dans votre `config.yml` ou fichier de configuration dynamique :

```yaml
http:
  middlewares:
    my-tianji-middleware:
      plugin:
        traefik-tianji-plugin:
          tianjiHost: "https://tianji.votre-domaine.com"
          websiteId: "votre-id-du-site"
```

#### Configuration Dynamique TOML

```toml
[http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin]
  tianjiHost = "https://tianji.votre-domaine.com"
  websiteId = "votre-id-du-site"
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
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.tianjiHost=https://tianji.votre-domaine.com"
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.websiteId=votre-id-du-site"
```

## Paramètres de Configuration

### Paramètres Requis

- **tianjiHost** : L'URL complète de votre serveur Tianji
  - Exemple : `https://tianji.votre-domaine.com`
  - Si vous utilisez le service hébergé officiel : `https://app-tianji.msgbyte.com`

- **websiteId** : L'ID du site créé dans Tianji
  - Peut être trouvé dans les paramètres du site de votre panneau d'administration Tianji

### Paramètres Optionnels

Le plugin prend également en charge d'autres paramètres de configuration pour personnaliser le comportement. Pour des paramètres spécifiques, veuillez consulter la [documentation du dépôt GitHub](https://github.com/msgbyte/traefik-tianji-plugin).

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

## Comment ça Marche

1. Lorsque les requêtes passent par le proxy Traefik, le plugin vérifie le contenu de la réponse
2. Si la réponse est un contenu HTML, le plugin injecte automatiquement le script de suivi Tianji
3. Le script commence à collecter des données de visiteurs et les envoie au serveur Tianji lorsque la page se charge

## Notes Importantes

- Assurez-vous que l'adresse du serveur Tianji est accessible depuis les navigateurs clients
- L'ID du site doit être valide, sinon les données ne peuvent pas être collectées correctement
- Le plugin n'agit que lorsque le type de contenu de la réponse est HTML
- Il est recommandé d'utiliser la dernière version du plugin pour des performances et des fonctionnalités optimales

## Référence

- [Code Source du Plugin](https://github.com/msgbyte/traefik-tianji-plugin)
- [Documentation des Plugins Traefik](https://doc.traefik.io/traefik/plugins/)
