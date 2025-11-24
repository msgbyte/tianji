---
sidebar_position: 7
_i18n_hash: f6c7dbe145cf9dcabd803f4db67fbe69
---
# Guide d'utilisation du SDK OpenAPI

Ce document fournit des instructions détaillées sur la façon d'utiliser le SDK Tianji pour appeler les interfaces OpenAPI et obtenir un accès programmatique complet aux services Tianji.

## Présentation

Le SDK OpenAPI de Tianji est basé sur un client TypeScript généré automatiquement, offrant des méthodes d'appel d'API sécurisées par type. Grâce au SDK, vous pouvez :

- Gérer les espaces de travail et les sites web
- Récupérer des données analytiques et des statistiques
- Opérer des projets de surveillance
- Gérer des sondages
- Gérer les flux et événements de chaînes
- ...

[Documentation complète de l'API](/api)

## Installation et Initialisation

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

## API de Configuration Globale

### Obtenir la configuration système

```javascript
import { openApiClient } from 'tianji-client-sdk';

async function getSystemConfig() {
  try {
    const config = await openApiClient.GlobalService.globalConfig();
    
    console.log('Autoriser l\'inscription :', config.allowRegister);
    console.log('Fonctionnalités IA activées :', config.ai.enable);
    console.log('Facturation activée :', config.enableBilling);
    
    return config;
  } catch (error) {
    console.error('Échec de l\'obtention de la configuration système :', error);
  }
}
```
