---
sidebar_position: 1
_i18n_hash: a144af118d2aa2c5e95b1cee1897ae7a
---
# Démarrage avec l'API

Tianji propose une API REST complète qui vous permet d'accéder et d'opérer de manière programmatique toutes les fonctionnalités de Tianji. Ce guide vous aidera à démarrer rapidement avec l'API Tianji.

## Aperçu

L'API Tianji repose sur l'architecture REST et utilise le format JSON pour l'échange de données. Toutes les requêtes API doivent être effectuées via HTTPS et nécessitent une authentification appropriée.

### URL de Base de l'API

```bash
https://votre-domaine-tianji.com/open
```

### Fonctionnalités Prises en Charge

Avec l'API Tianji, vous pouvez :

- Gérer les données d'analyse de site web
- Créer et gérer des projets de surveillance
- Obtenir des informations sur le statut des serveurs
- Gérer les enquêtes
- Opérer les données de télémétrie
- Créer et gérer des espaces de travail

## Démarrage Rapide

### 1. Obtenir une Clé API

Avant d'utiliser l'API, vous devez obtenir une clé API :

1. Connectez-vous à votre instance Tianji
2. Cliquez sur votre avatar en haut à droite
4. Trouvez la section **Clés API**
5. Cliquez sur le bouton + pour créer une nouvelle clé API
6. Nommez votre clé API et enregistrez-la

### 2. Activer OpenAPI

Assurez-vous que votre instance Tianji a l'accès OpenAPI activé :

Définissez dans vos variables d'environnement :
```bash
ALLOW_OPENAPI=true
```

### 3. Premier Appel API

Testez votre connexion API en utilisant curl :

```bash
curl -X GET "https://votre-domaine-tianji.com/open/global/config" \
  -H "Authorization: Bearer VOTRE_CLÉ_API" \
  -H "Content-Type: application/json"
```

## Prochaines Étapes

- Consultez la [Documentation d'Authentification](./authentication.md) pour obtenir des détails sur les méthodes d'authentification
- Parcourez la [Documentation de Référence API](/api) pour tous les points d'accès disponibles
- Utilisez le [SDK OpenAPI](./openapi-sdk.md) pour des appels API avec typage sécurisé
