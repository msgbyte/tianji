---
sidebar_position: 7
_i18n_hash: 31c4981c02a399801d9f7185e51b5e44
---
# OpenAPI SDK-Nutzungsanleitung

Dieses Dokument bietet detaillierte Anweisungen zur Verwendung des Tianji SDKs, um OpenAPI-Schnittstellen aufzurufen und einen vollständigen programmgesteuerten Zugriff auf Tianji-Dienste zu erlangen.

## Überblick

Das Tianji OpenAPI SDK basiert auf einem automatisch generierten TypeScript-Client und bietet typsichere API-Aufrufmethoden. Über das SDK können Sie:

- Arbeitsbereiche und Websites verwalten
- Analysedaten und Statistiken abrufen
- Überwachungsprojekte betreiben
- Umfragen verwalten
- Feed-Kanäle und Ereignisse handhaben
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
    
    console.log('Registrierung erlaubt:', config.allowRegister);
    console.log('KI-Funktionen aktiviert:', config.ai.enable);
    console.log('Abrechnung aktiviert:', config.enableBilling);
    
    return config;
  } catch (error) {
    console.error('Fehler beim Abrufen der Systemkonfiguration:', error);
  }
}
```
