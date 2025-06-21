---
sidebar_position: 1
_i18n_hash: 2a8dfc997c42846304cde1b51f4d6145
---
# Démarrage de l'API

Tianji fournit une API REST complète qui vous permet d'accéder et d'exploiter toutes les fonctionnalités de Tianji de manière programmatique. Ce guide vous aidera à démarrer rapidement avec l'API Tianji.

## Aperçu

L'API Tianji est basée sur l'architecture REST et utilise le format JSON pour l'échange de données. Toutes les requêtes API doivent être effectuées via HTTPS et nécessitent une authentification appropriée.

### URL de base de l'API

```bash
https://votre-domaine-tianji.com/open
```

### Fonctionnalités prises en charge

Grâce à l'API Tianji, vous pouvez :

- Gérer les données analytiques du site web
- Créer et gérer des projets de surveillance
- Obtenir des informations sur le statut du serveur
- Gérer des enquêtes
- Exploiter les données de télémetrie
- Créer et gérer des espaces de travail

## Démarrage rapide

### 1. Obtenez la clé API

Avant d'utiliser l'API, vous devez obtenir une clé API :

1. Connectez-vous à votre instance Tianji
2. Cliquez sur votre avatar en haut à droite
3. Trouvez la section **Clés API**
4. Cliquez sur le bouton + pour créer une nouvelle clé API
5. Nommez votre clé API et enregistrez-la

### 2. Activez OpenAPI

Assurez-vous que votre instance Tianji a un accès OpenAPI activé :

Définissez dans vos variables d'environnement :
```bash
ALLOW_OPENAPI=true
```

### 3. Premier appel API

Testez votre connexion API en utilisant curl :

```bash
curl -X GET "https://votre-domaine-tianji.com/open/global/config" \
  -H "Authorization: Bearer <VOTRE_CLÉ_API>" \
  -H "Content-Type: application/json"
```

## Prochaines étapes

- Consultez la [Documentation d'authentification](./authentication.md) pour des méthodes d'authentification détaillées
- Parcourez la [Documentation de référence de l'API](/api) pour tous les points d'accès disponibles
- Utilisez le [SDK OpenAPI](./openapi-sdk.md) pour des appels d'API sécurisés par type
