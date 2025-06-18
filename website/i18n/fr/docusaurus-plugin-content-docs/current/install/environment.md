---
sidebar_position: 10
_i18n_hash: 0648c6e4c85f3bd3ac4cdd91fad4eb39
---
# Variables d'environnement

Tianji prend en charge diverses variables d'environnement pour personnaliser son comportement. Vous pouvez configurer ces variables dans le champ `env` de votre docker-compose ou via votre environnement de déploiement.

## Configuration de base

| Variable | Description | Défault | Exemple |
| --- | --- | --- | --- |
| `PORT` | Port du serveur | `12345` | `3000` |
| `JWT_SECRET` | Secret pour les tokens JWT | Texte aléatoire | `votre-clé-secrète` |
| `ALLOW_REGISTER` | Activer l'enregistrement des utilisateurs | `false` | `true` |
| `ALLOW_OPENAPI` | Activer l'accès OpenAPI | `true` | `false` |
| `WEBSITE_ID` | Identifiant du site web | - | `votre-id-site-web` |
| `DISABLE_AUTO_CLEAR` | Désactiver le nettoyage automatique des données | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | Désactiver les journaux d'accès | `false` | `true` |
| `DB_DEBUG` | Activer le débogage de la base de données | `false` | `true` |

## Authentification

| Variable | Description | Défault | Exemple |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | Désactiver l'authentification basée sur le compte | `false` | `true` |
| `AUTH_SECRET` | Secret d'authentification | MD5 du secret JWT | `votre-secret-auth` |
| `AUTH_RESTRICT_EMAIL` | Restreindre l'inscription à des domaines d'email spécifiques | - | `@example.com` |

### Authentification par Email et Invitation par Email

| Variable | Description | Défault | Exemple |
| --- | --- | --- | --- |
| `EMAIL_SERVER` | Serveur SMTP pour les emails | - | `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | Adresse de l'expéditeur de l'email | - | `noreply@example.com` |

### Authentification GitHub

| Variable | Description | Défault | Exemple |
| --- | --- | --- | --- |
| `AUTH_GITHUB_ID` | ID client OAuth GitHub | - | `votre-id-client-github` |
| `AUTH_GITHUB_SECRET` | Secret client OAuth GitHub | - | `votre-secret-client-github` |

### Authentification Google

| Variable | Description | Défault | Exemple |
| --- | --- | --- | --- |
| `AUTH_GOOGLE_ID` | ID client OAuth Google | - | `votre-id-client-google` |
| `AUTH_GOOGLE_SECRET` | Secret client OAuth Google | - | `votre-secret-client-google` |

### Authentification personnalisée OAuth/OIDC

| Variable | Description | Défault | Exemple |
| --- | --- | --- | --- |
| `AUTH_CUSTOM_ID` | ID client OAuth/OIDC personnalisé | - | `votre-id-client-personnalisé` |
| `AUTH_CUSTOM_SECRET` | Secret client OAuth/OIDC personnalisé | - | `votre-secret-client-personnalisé` |
| `AUTH_CUSTOM_NAME` | Nom du fournisseur personnalisé | `Custom` | `SSO d'entreprise` |
| `AUTH_CUSTOM_TYPE` | Type d'authentification | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUR` | URL de l'émetteur OIDC | - | `https://auth.example.com` |

## Fonctionnalités AI

| Variable | Description | Défault | Exemple |
| --- | --- | --- | --- |
| `SHARED_OPENAI_API_KEY` | Clé API OpenAI | - | `votre-clé-api-openai` |
| `SHARED_OPENAI_BASE_URL` | URL API OpenAI personnalisée | - | `https://api.openai.com/v1` |
| `SHARED_OPENAI_MODEL_NAME` | Modèle OpenAI à utiliser | `gpt-4o` | `gpt-3.5-turbo` |
| `DEBUG_AI_FEATURE` | Déboguer les fonctionnalités AI | `false` | `true` |

## Configuration du Bac à Sable

| Variable | Description | Défault | Exemple |
| --- | --- | --- | --- |
| `USE_VM2` | Utiliser VM2 pour l'exécution de bac à sable | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | Limite de mémoire pour le bac à sable (MB) | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Chemin personnalisé vers l'exécutable Puppeteer | - | `/usr/bin/chromium` |

## Intégration de Cartes

| Variable | Description | Défault | Exemple |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | Jeton API AMap (Gaode) | - | `votre-token-amap` |
| `MAPBOX_TOKEN` | Jeton API Mapbox | - | `votre-token-mapbox` |

## Télémétrie

| Variable | Description | Défault | Exemple |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | Désactiver la télémétrie anonyme | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | Nom du script de suivi personnalisé | - | `custom-tracker.js` |

## Définir les Variables d'Environnement

Vous pouvez définir ces variables d'environnement de différentes manières :

1. Définissez-les directement dans votre environnement de déploiement (Docker, Kubernetes, etc.)

2. Pour les déploiements Docker, vous pouvez utiliser les variables d'environnement dans votre docker-compose.yml :

```yaml
services:
  tianji:
    image: moonrailgun/tianji:latest
    environment:
      - PORT=3000
      - ALLOW_REGISTER=true
```

## Valeurs Booléennes

Pour les variables d'environnement booléennes, vous pouvez utiliser soit `"1"` soit `"true"` pour activer la fonctionnalité, et soit omettre la variable soit la définir sur toute autre valeur pour la désactiver.
