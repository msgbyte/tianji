---
sidebar_position: 7
_i18n_hash: 31c4981c02a399801d9f7185e51b5e44
---
# Guía de Uso del SDK de OpenAPI

Este documento ofrece instrucciones detalladas sobre cómo utilizar el SDK de Tianji para llamar a las interfaces de OpenAPI y lograr un acceso programático completo a los servicios de Tianji.

## Descripción General

El SDK de Tianji OpenAPI está basado en un cliente TypeScript auto-generado, proporcionando métodos de llamadas API seguras con tipos. A través del SDK, puedes:

- Gestionar espacios de trabajo y sitios web
- Recuperar datos analíticos y estadísticas
- Operar proyectos de monitoreo
- Administrar encuestas
- Manejar canales y eventos de Feed
- ...

[Documentación Completa de la API](/api)

## Instalación e Inicialización

### Instalar el SDK

```bash
npm install tianji-client-sdk
# o
yarn add tianji-client-sdk
# o
pnpm add tianji-client-sdk
```

### Inicializar el Cliente de OpenAPI

```javascript
import { initOpenapiSDK } from 'tianji-client-sdk';

initOpenapiSDK('https://tu-dominio-tianji.com', {
  apiKey: 'tu-api-key'
});
```

## API de Configuración Global

### Obtener Configuración del Sistema

```javascript
import { openApiClient } from 'tianji-client-sdk';

async function getSystemConfig() {
  try {
    const config = await openApiClient.GlobalService.globalConfig();
    
    console.log('Permitir registro:', config.allowRegister);
    console.log('Funciones de IA habilitadas:', config.ai.enable);
    console.log('Facturación habilitada:', config.enableBilling);
    
    return config;
  } catch (error) {
    console.error('Error al obtener la configuración del sistema:', error);
  }
}
```
