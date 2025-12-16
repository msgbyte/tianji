---
sidebar_position: 7
_i18n_hash: 31c4981c02a399801d9f7185e51b5e44
---
# Guide d'utilisation du SDK OpenAPI

Ce document fournit des instructions détaillées sur la façon d'utiliser le SDK Tianji pour appeler les interfaces OpenAPI et obtenir un accès programmatique complet aux services Tianji.

## Aperçu

Le SDK Tianji OpenAPI est basé sur un client TypeScript généré automatiquement, fournissant des méthodes d'appels d'API sûres en termes de types. Grâce au SDK, vous pouvez :

- Gérer les espaces de travail et les sites web
- Récupérer les données d'analyse et les statistiques
- Exploiter les projets de surveillance
- Gérer les sondages
- Gérer les canaux et événements de Feed
- ...

[Documentation complète de l'API](/api)

## Installation et initialisation

### Installer le SDK

```bash
npm install tianji-client-sdk
# ou
yarn add tianji-client-sdk
# ou
pnpm add tianji-client-sdk
```

### Initialiser le client OpenAPI

```javascript
import { initOpenapiSDK } from 'tianji-client-sdk';

initOpenapiSDK('https://votre-domaine-tianji.com', {
  apiKey: 'votre-clé-api'
});
```

## API de configuration globale

### Obtenir la configuration système

```javascript
import { openApiClient } from 'tianji-client-sdk';

async function getSystemConfig() {
  try {
    const config = await openApiClient.GlobalService.globalConfig();
    
    console.log('Autoriser l\'inscription :', config.allowRegister);
    console.log('Fonctionnalités AI activées :', config.ai.enable);
    console.log('Facturation activée :', config.enableBilling);
    
    return config;
  } catch (error) {
    console.error('Échec de l\'obtention de la configuration système :', error);
  }
}
```
