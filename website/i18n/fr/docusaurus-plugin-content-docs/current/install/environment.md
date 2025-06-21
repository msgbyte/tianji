---
sidebar_position: 10
_i18n_hash: f2ef2fcca017df87250ccfb0a4dc798c
---
# Variables d'environnement

Tianji prend en charge diverses variables d'environnement pour personnaliser son comportement. Vous pouvez configurer ces variables dans le champ `env` de votre fichier docker compose ou via votre environnement de déploiement.

## Configuration de base

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `PORT` | Port du serveur | `12345` | `3000` |
| `JWT_SECRET` | Secret pour les jetons JWT | Texte aléatoire | `your-secret-key` |
| `ALLOW_REGISTER` | Activer l'enregistrement des utilisateurs | `false` | `true` |
| `ALLOW_OPENAPI` | Activer l'accès OpenAPI | `true` | `false` |
| `WEBSITE_ID` | Identifiant du site web | - | `your-website-id` |
| `DISABLE_AUTO_CLEAR` | Désactiver le nettoyage automatique des données | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | Désactiver les journaux d'accès | `false` | `true` |
| `DB_DEBUG` | Activer le débogage de la base de données | `false` | `true` |

## Authentification

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | Désactiver l'authentification basée sur le compte | `false` | `true` |
| `AUTH_SECRET` | Secret d'authentification | MD5 du JWT secret | `your-auth-secret` |
| `AUTH_RESTRICT_EMAIL` | Restreindre l'inscription aux domaines de messagerie spécifiques | - | `@example.com` |

### Authentification par e-mail et invitation par e-mail

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `EMAIL_SERVER` | Serveur SMTP pour e-mail | - | `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | Adresse de l'expéditeur de l'e-mail | - | `noreply@example.com` |

### Authentification GitHub

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `AUTH_GITHUB_ID` | ID client OAuth GitHub | - | `your-github-client-id` |
| `AUTH_GITHUB_SECRET` | Secret client OAuth GitHub | - | `your-github-client-secret` |

### Authentification Google

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `AUTH_GOOGLE_ID` | ID client OAuth Google | - | `your-google-client-id` |
| `AUTH_GOOGLE_SECRET` | Secret client OAuth Google | - | `your-google-client-secret` |

### Authentification personnalisée OAuth/OIDC

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `AUTH_CUSTOM_ID` | ID client OAuth/OIDC personnalisée | - | `your-custom-client-id` |
| `AUTH_CUSTOM_SECRET` | Secret client OAuth/OIDC personnalisée | - | `your-custom-client-secret` |
| `AUTH_CUSTOM_NAME` | Nom du fournisseur personnalisé | `Custom` | `Enterprise SSO` |
| `AUTH_CUSTOM_TYPE` | Type d'authentification | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUR` | URL de l'émetteur OIDC | - | `https://auth.example.com` |

## Fonctionnalités AI

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `SHARED_OPENAI_API_KEY` | Clé API OpenAI | - | `your-openai-api-key` |
| `SHARED_OPENAI_BASE_URL` | URL personnalisée de l'API OpenAI | - | `https://api.openai.com/v1` |
| `SHARED_OPENAI_MODEL_NAME` | Modèle OpenAI à utiliser | `gpt-4o` | `gpt-3.5-turbo` |
| `DEBUG_AI_FEATURE` | Déboguer les fonctionnalités AI | `false` | `true` |

## Configuration de la Sandbox

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `USE_VM2` | Utiliser VM2 pour l'exécution de la sandbox | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | Limite de mémoire pour la sandbox (MB) | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Chemin personnalisé vers l'exécutable Puppeteer | - | `/usr/bin/chromium` |

## Intégration des cartes

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | Jeton API AMap (Gaode) | - | `your-amap-token` |
| `MAPBOX_TOKEN` | Jeton API Mapbox | - | `your-mapbox-token` |

## Télémétrie

| Variable | Description | Par défaut | Exemple |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | Désactiver la télémétrie anonyme | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | Nom du script de suivi personnalisé | - | `custom-tracker.js` |

## Configuration des variables d'environnement

Vous pouvez définir ces variables d'environnement de différentes manières:

1. Les définir directement dans votre environnement de déploiement (Docker, Kubernetes, etc.)

2. Pour les déploiements Docker, vous pouvez utiliser des variables d'environnement dans votre fichier docker-compose.yml:

```yaml
services:
  tianji:
    image: moonrailgun/tianji:latest
    environment:
      - PORT=3000
      - ALLOW_REGISTER=true
```

## Valeurs booléennes

Pour les variables d'environnement booléennes, vous pouvez utiliser soit `"1"` soit `"true"` pour activer la fonctionnalité, ou bien omettre la variable ou la définir sur n'importe quelle autre valeur pour la désactiver.
