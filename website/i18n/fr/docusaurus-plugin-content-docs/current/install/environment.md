---
sidebar_position: 10
_i18n_hash: a89f05aed50f89d55367e4d1d6598373
---
# Variables d'environnement

Tianji prend en charge diverses variables d'environnement pour personnaliser son comportement. Vous pouvez configurer ces variables dans votre champ `env` de composition docker ou via votre environnement de déploiement.

## Configuration de base

| Variable | Description | Défaut | Exemple |
| --- | --- | --- | --- |
| `PORT` | Port du serveur | `12345` | `3000` |
| `JWT_SECRET` | Secret pour les jetons JWT | Texte aléatoire | `votre-secret-key` |
| `ALLOW_REGISTER` | Activer l'enregistrement des utilisateurs | `false` | `true` |
| `ALLOW_OPENAPI` | Activer l'accès OpenAPI | `true` | `false` |
| `WEBSITE_ID` | Identifiant du site web | - | `votre-website-id` |
| `DISABLE_AUTO_CLEAR` | Désactiver le nettoyage automatique des données | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | Désactiver les journaux d'accès | `false` | `true` |
| `DB_DEBUG` | Activer le débogage de la base de données | `false` | `true` |
| `ALPHA_MODE` | Activer les fonctionnalités alpha | `false` | `true` |
| `ENABLE_FUNCTION_WORKER` | Activer le worker de fonction | `false` | `true` |
| `REGISTER_AUTO_JOIN_WORKSPACE_ID` | ID de l'espace de travail pour les nouveaux utilisateurs | - | `workspace-id-123` |

## Configuration du cache

| Variable | Description | Défaut | Exemple |
| --- | --- | --- | --- |
| `CACHE_MEMORY_ONLY` | Utiliser uniquement la mise en cache mémoire | `false` | `true` |
| `REDIS_URL` | URL de connexion Redis | - | `redis://localhost:6379` |

## Authentification

| Variable | Description | Défaut | Exemple |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | Désactiver l'authentification par compte | `false` | `true` |
| `AUTH_SECRET` | Secret d'authentification | MD5 du secret JWT | `votre-auth-secret` |
| `AUTH_RESTRICT_EMAIL` | Restreindre l'enregistrement à certains domaines d'e-mail | - | `@example.com` |
| `AUTH_USE_SECURE_COOKIES` | Utiliser des cookies sécurisés pour l'authentification | `false` | `true` |

### Authentification par e-mail et invitation par e-mail

| Variable | Description | Défaut | Exemple |
| --- | --- | --- | --- |
| `EMAIL_SERVER` | Serveur SMTP pour les e-mails | - | `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | Adresse de l'expéditeur d'e-mail | - | `noreply@example.com` |

### Authentification GitHub

| Variable | Description | Défaut | Exemple |
| --- | --- | --- | --- |
| `AUTH_GITHUB_ID` | ID client OAuth GitHub | - | `votre-github-client-id` |
| `AUTH_GITHUB_SECRET` | Secret client OAuth GitHub | - | `votre-github-client-secret` |

### Authentification Google

| Variable | Description | Défaut | Exemple |
| --- | --- | --- | --- |
| `AUTH_GOOGLE_ID` | ID client OAuth Google | - | `votre-google-client-id` |
| `AUTH_GOOGLE_SECRET` | Secret client OAuth Google | - | `votre-google-client-secret` |

### Authentification OAuth/OIDC personnalisée

| Variable | Description | Défaut | Exemple |
| --- | --- | --- | --- |
| `AUTH_CUSTOM_ID` | ID client OAuth/OIDC personnalisé | - | `votre-custom-client-id` |
| `AUTH_CUSTOM_SECRET` | Secret client OAuth/OIDC personnalisé | - | `votre-custom-client-secret` |
| `AUTH_CUSTOM_NAME` | Nom du fournisseur personnalisé | `Personnalisé` | `SSO Entreprise` |
| `AUTH_CUSTOM_TYPE` | Type d'authentification | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUER` | URL de l'émetteur OIDC | - | `https://auth.example.com` |

## Fonctionnalités AI

| Variable | Description | Défaut | Exemple |
| --- | --- | --- | --- |
| `SHARED_OPENAI_API_KEY` | Clé API OpenAI | - | `votre-openai-api-key` |
| `SHARED_OPENAI_BASE_URL` | URL API OpenAI personnalisée | - | `https://api.openai.com/v1` |
| `SHARED_OPENAI_MODEL_NAME` | Modèle OpenAI à utiliser | `gpt-4o` | `gpt-3.5-turbo` |
| `SHARED_OPENAI_TOKEN_CALC_CONCURRENCY` | Concurrence de calcul des jetons | `5` | `10` |
| `DEBUG_AI_FEATURE` | Déboguer les fonctionnalités AI | `false` | `true` |

## Configuration ClickHouse

| Variable | Description | Défaut | Exemple |
| --- | --- | --- | --- |
| `CLICKHOUSE_URL` | URL de la base de données ClickHouse | - | `http://localhost:8123` |
| `CLICKHOUSE_USER` | Nom d'utilisateur ClickHouse | - | `default` |
| `CLICKHOUSE_PASSWORD` | Mot de passe ClickHouse | - | `votre-password` |
| `CLICKHOUSE_DATABASE` | Nom de la base de données ClickHouse | - | `tianji` |
| `CLICKHOUSE_DEBUG` | Activer le débogage ClickHouse | `false` | `true` |
| `CLICKHOUSE_DISABLE_SYNC` | Désactiver la synchronisation ClickHouse | `false` | `true` |
| `CLICKHOUSE_SYNC_BATCH_SIZE` | Taille de lot de synchronisation | `10000` | `5000` |
| `CLICKHOUSE_ENABLE_FALLBACK` | Activer la solution de secours ClickHouse | `true` | `false` |
| `CLICKHOUSE_HEALTH_CHECK_INTERVAL` | Intervalle de vérification de santé (ms) | `30000` | `60000` |
| `CLICKHOUSE_MAX_CONSECUTIVE_FAILURES` | Échecs consécutifs maximum | `3` | `5` |
| `CLICKHOUSE_RETRY_INTERVAL` | Intervalle de réessai (ms) | `5000` | `10000` |

## Système de facturation (LemonSqueezy)

| Variable | Description | Défaut | Exemple |
| --- | --- | --- | --- |
| `ENABLE_BILLING` | Activer la fonctionnalité de facturation | `false` | `true` |
| `LEMON_SQUEEZY_SIGNATURE_SECRET` | Secret de signature webhook LemonSqueezy | - | `votre-signature-secret` |
| `LEMON_SQUEEZY_API_KEY` | Clé API LemonSqueezy | - | `votre-api-key` |
| `LEMON_SQUEEZY_STORE_ID` | ID du magasin LemonSqueezy | - | `votre-store-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_FREE_ID` | ID de variante d'abonnement gratuit | - | `free-variant-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_PRO_ID` | ID de variante d'abonnement Pro | - | `pro-variant-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_TEAM_ID` | ID de variante d'abonnement d'équipe | - | `team-variant-id` |

## Configuration Sandbox

| Variable | Description | Défaut | Exemple |
| --- | --- | --- | --- |
| `USE_VM2` | Utiliser VM2 pour l'exécution sandbox | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | Limite de mémoire pour la sandbox (MB) | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Chemin personnalisé vers l'exécutable Puppeteer | - | `/usr/bin/chromium` |

## Intégration de cartes

| Variable | Description | Défaut | Exemple |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | Jeton API AMap (Gaode) | - | `votre-amap-token` |
| `MAPBOX_TOKEN` | Jeton API Mapbox | - | `votre-mapbox-token` |

## Télémétrie

| Variable | Description | Défaut | Exemple |
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

Pour les variables d'environnement booléennes, vous pouvez utiliser soit `"1"` soit `"true"` pour activer la fonctionnalité, ou soit omettre la variable, soit la définir à une autre valeur pour la désactiver.
