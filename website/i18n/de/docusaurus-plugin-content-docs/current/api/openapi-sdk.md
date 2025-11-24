---
sidebar_position: 7
_i18n_hash: f6c7dbe145cf9dcabd803f4db67fbe69
---
# OpenAPI SDK-Benutzerhandbuch

Dieses Dokument bietet detaillierte Anleitungen zur Verwendung des Tianji SDK, um OpenAPI-Schnittstellen aufzurufen und vollständigen programmatischen Zugriff auf Tianji-Dienste zu erreichen.

## Übersicht

Das Tianji OpenAPI SDK basiert auf einem automatisch generierten TypeScript-Client und bietet typensichere API-Aufrufmethoden. Über das SDK können Sie:

- Workspaces und Websites verwalten
- Analysedaten und Statistiken abrufen
- Überwachungsprojekte betreiben
- Umfragen verwalten
- Feed-Kanäle und -Ereignisse handhaben
- ...

[Vollständige API-Dokumentation](/api)

## Installation und Initialisierung

### SDK installieren

```bash
npm install tianji-client-sdk
# oder
yarn add tianji-client-sdk
# oder
pnpm add tianji-client-sdk
```

### OpenAPI-Client initialisieren

```javascript
import { initOpenapiSDK } from 'tianji-client-sdk';

initOpenapiSDK('https://your-tianji-domain.com', {
  apiKey: 'your-api-key'
});
```

## Globale Konfigurations-API

### Systemkonfiguration abrufen

```javascript
import { openApiClient } from 'tianji-client-sdk';

async function getSystemConfig() {
  try {
    const config = await openApiClient.GlobalService.globalConfig();
    
    console.log('Registrierung erlauben:', config.allowRegister);
    console.log('KI-Funktionen aktiviert:', config.ai.enable);
    console.log('Abrechnung aktiviert:', config.enableBilling);
    
    return config;
  } catch (error) {
    console.error('Fehler beim Abrufen der Systemkonfiguration:', error);
  }
}
```
