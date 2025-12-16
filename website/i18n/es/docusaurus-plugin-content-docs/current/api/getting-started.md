---
sidebar_position: 1
_i18n_hash: 2a8dfc997c42846304cde1b51f4d6145
---
# Introducción a la API

Tianji proporciona una API REST completa que te permite acceder y operar programáticamente todas las características de Tianji. Esta guía te ayudará a comenzar rápidamente con la API de Tianji.

## Resumen

La API de Tianji está basada en la arquitectura REST y utiliza el formato JSON para el intercambio de datos. Todas las solicitudes a la API deben hacerse a través de HTTPS y requieren la autenticación adecuada.

### URL Base de la API

```bash
https://your-tianji-domain.com/open
```

### Funciones Soportadas

A través de la API de Tianji, puedes:

- Gestionar los datos de analítica del sitio web
- Crear y gestionar proyectos de monitoreo
- Obtener información del estado del servidor
- Administrar encuestas
- Operar con datos de telemetría
- Crear y gestionar espacios de trabajo

## Inicio Rápido

### 1. Obtener Clave API

Antes de usar la API, necesitas obtener una clave de API:

1. Inicia sesión en tu instancia de Tianji
2. Haz clic en tu avatar en la esquina superior derecha
4. Encuentra la sección **API Keys**
5. Haz clic en el botón + para crear una nueva clave API
6. Nombra tu clave API y guárdala

### 2. Habilitar OpenAPI

Asegúrate de que tu instancia de Tianji tenga habilitado el acceso a OpenAPI:

Configúralo en tus variables de entorno:
```bash
ALLOW_OPENAPI=true
```

### 3. Primera Llamada a la API

Prueba tu conexión API usando curl:

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json"
```

## Próximos Pasos

- Consulta la [Documentación de Autenticación](./authentication.md) para métodos de autenticación detallados
- Explora la [Documentación de Referencia de la API](/api) para todos los puntos finales disponibles
- Usa el [SDK de OpenAPI](./openapi-sdk.md) para llamadas a la API seguras con tipos
