---
sidebar_position: 10
_i18n_hash: 5ff3432ae327097b85732e04b2cda2d3
---
# Variables d'environnement

Tianji prend en charge diverses variables d'environnement pour personnaliser son comportement. Vous pouvez configurer ces variables dans votre champ `env` de docker compose ou via votre environnement de déploiement.

## Configuration de base

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `PORT` | Port du serveur | `12345` | `3000` |
| `JWT_SECRET` | Clé secrète pour les jetons JWT | Texte aléatoire | `your-secret-key` |
| `ALLOW_REGISTER` | Activer l'enregistrement des utilisateurs | `false` | `true` |
| `ALLOW_OPENAPI` | Activer l'accès OpenAPI | `true` | `false` |
| `WEBSITE_ID` | Identifiant du site Web | - | `your-website-id` |
| `DISABLE_AUTO_CLEAR` | Désactiver le nettoyage automatique des données | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | Désactiver les journaux d'accès | `false` | `true` |
| `DB_DEBUG` | Activer le débogage de la base de données | `false` | `true` |

## Authentification

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | Désactiver l'authentification basée sur le compte | `false` | `true` |
| `AUTH_SECRET` | Clé secrète d'authentification | MD5 de la clé JWT | `your-auth-secret` |
| `AUTH_RESTRICT_EMAIL` | Restreindre l'enregistrement à des domaines d'email spécifiques | - | `@example.com` |

### Authentification par email

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `EMAIL_SERVER` | Serveur SMTP pour email | - | `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | Adresse de l'expéditeur de l'email | - | `noreply@example.com` |

### Authentification GitHub

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `AUTH_GITHUB_ID` | ID client OAuth de GitHub | - | `your-github-client-id` |
| `AUTH_GITHUB_SECRET` | Secret client OAuth de GitHub | - | `your-github-client-secret` |

### Authentification Google

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `AUTH_GOOGLE_ID` | ID client OAuth de Google | - | `your-google-client-id` |
| `AUTH_GOOGLE_SECRET` | Secret client OAuth de Google | - | `your-google-client-secret` |

### Authentification OAuth/OIDC personnalisée

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `AUTH_CUSTOM_ID` | ID client OAuth/OIDC personnalisé | - | `your-custom-client-id` |
| `AUTH_CUSTOM_SECRET` | Secret client OAuth/OIDC personnalisé | - | `your-custom-client-secret` |
| `AUTH_CUSTOM_NAME` | Nom du fournisseur personnalisé | `Custom` | `Enterprise SSO` |
| `AUTH_CUSTOM_TYPE` | Type d'authentification | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUR` | URL émettrice OIDC | - | `https://auth.example.com` |

## Fonctions AI

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | Clé API OpenAI | - | `your-openai-api-key` |
| `OPENAI_BASE_URL` | URL personnalisée de l'API OpenAI | - | `https://api.openai.com/v1` |
| `OPENAI_MODEL_NAME` | Modèle OpenAI à utiliser | `gpt-4o` | `gpt-3.5-turbo` |
| `DEBUG_AI_FEATURE` | Déboguer les fonctionnalités AI | `false` | `true` |

## Configuration Sandbox

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `USE_VM2` | Utiliser VM2 pour l'exécution en sandbox | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | Limite de mémoire pour la sandbox (MB) | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Chemin personnalisé vers l'exécutable Puppeteer | - | `/usr/bin/chromium` |

## Intégration de cartes

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | Jeton API AMap (Gaode) | - | `your-amap-token` |
| `MAPBOX_TOKEN` | Jeton API Mapbox | - | `your-mapbox-token` |

## Télémétrie

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | Désactiver la télémétrie anonyme | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | Nom du script de suivi personnalisé | - | `custom-tracker.js` |

## Définir les variables d'environnement

Vous pouvez définir ces variables d'environnement de différentes manières :

1. Les définir directement dans votre environnement de déploiement (Docker, Kubernetes, etc.)

2. Pour les déploiements Docker, vous pouvez utiliser des variables d'environnement dans votre docker-compose.yml :

```yaml
services:
  tianji:
    image: moonrailgun/tianji:latest
    environment:
      - PORT=3000
      - ALLOW_REGISTER=true
```

## Valeurs booléennes

Pour les variables booléennes, vous pouvez utiliser soit `"1"` soit `"true"` pour activer la fonctionnalité, et soit omettre la variable soit la définir sur toute autre valeur pour la désactiver.
