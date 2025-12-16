---
sidebar_position: 10
_i18n_hash: a89f05aed50f89d55367e4d1d6598373
---
# Variables de entorno

Tianji admite varias variables de entorno para personalizar su comportamiento. Puedes configurar estas variables en tu campo `env` de docker-compose o a través de tu entorno de despliegue.

## Configuración básica

| Variable | Descripción | Valor por defecto | Ejemplo |
| --- | --- | --- | --- |
| `PORT` | Puerto del servidor | `12345` | `3000` |
| `JWT_SECRET` | Clave secreta para tokens JWT | Texto aleatorio | `your-secret-key` |
| `ALLOW_REGISTER` | Permitir registro de usuarios | `false` | `true` |
| `ALLOW_OPENAPI` | Permitir acceso a OpenAPI | `true` | `false` |
| `WEBSITE_ID` | Identificador del sitio web | - | `your-website-id` |
| `DISABLE_AUTO_CLEAR` | Desactivar limpieza automática de datos | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | Desactivar registros de acceso | `false` | `true` |
| `DB_DEBUG` | Activar depuración de la base de datos | `false` | `true` |
| `ALPHA_MODE` | Activar características alpha | `false` | `true` |
| `ENABLE_FUNCTION_WORKER` | Activar trabajador de funciones | `false` | `true` |
| `REGISTER_AUTO_JOIN_WORKSPACE_ID` | ID de espacio de trabajo para unión automática de nuevos usuarios | - | `workspace-id-123` |

## Configuración de caché

| Variable | Descripción | Valor por defecto | Ejemplo |
| --- | --- | --- | --- |
| `CACHE_MEMORY_ONLY` | Usar solo memoria para almacenamiento en caché | `false` | `true` |
| `REDIS_URL` | URL de conexión Redis | - | `redis://localhost:6379` |

## Autenticación

| Variable | Descripción | Valor por defecto | Ejemplo |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | Desactivar autenticación basada en cuentas | `false` | `true` |
| `AUTH_SECRET` | Clave secreta de autenticación | MD5 del secreto JWT | `your-auth-secret` |
| `AUTH_RESTRICT_EMAIL` | Restringir registro a dominios de correo específicos | - | `@example.com` |
| `AUTH_USE_SECURE_COOKIES` | Usar cookies seguras para autenticación | `false` | `true` |

### Autenticación por correo electrónico e invitación por correo

| Variable | Descripción | Valor por defecto | Ejemplo |
| --- | --- | --- | --- |
| `EMAIL_SERVER` | Servidor SMTP para correo electrónico | - | `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | Dirección de correo del remitente | - | `noreply@example.com` |

### Autenticación con GitHub

| Variable | Descripción | Valor por defecto | Ejemplo |
| --- | --- | --- | --- |
| `AUTH_GITHUB_ID` | ID de cliente OAuth de GitHub | - | `your-github-client-id` |
| `AUTH_GITHUB_SECRET` | Secreto de cliente OAuth de GitHub | - | `your-github-client-secret` |

### Autenticación con Google

| Variable | Descripción | Valor por defecto | Ejemplo |
| --- | --- | --- | --- |
| `AUTH_GOOGLE_ID` | ID de cliente OAuth de Google | - | `your-google-client-id` |
| `AUTH_GOOGLE_SECRET` | Secreto de cliente OAuth de Google | - | `your-google-client-secret` |

### Autenticación personalizada OAuth/OIDC

| Variable | Descripción | Valor por defecto | Ejemplo |
| --- | --- | --- | --- |
| `AUTH_CUSTOM_ID` | ID de cliente OAuth/OIDC personalizado | - | `your-custom-client-id` |
| `AUTH_CUSTOM_SECRET` | Secreto de cliente OAuth/OIDC personalizado | - | `your-custom-client-secret` |
| `AUTH_CUSTOM_NAME` | Nombre de proveedor personalizado | `Custom` | `Enterprise SSO` |
| `AUTH_CUSTOM_TYPE` | Tipo de autenticación | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUER` | URL del emisor OIDC | - | `https://auth.example.com` |

## Características de IA

| Variable | Descripción | Valor por defecto | Ejemplo |
| --- | --- | --- | --- |
| `SHARED_OPENAI_API_KEY` | Clave de API de OpenAI | - | `your-openai-api-key` |
| `SHARED_OPENAI_BASE_URL` | URL de API de OpenAI personalizada | - | `https://api.openai.com/v1` |
| `SHARED_OPENAI_MODEL_NAME` | Modelo de OpenAI a usar | `gpt-4o` | `gpt-3.5-turbo` |
| `SHARED_OPENAI_TOKEN_CALC_CONCURRENCY` | Concurrencia de cálculo de tokens | `5` | `10` |
| `DEBUG_AI_FEATURE` | Depurar características de IA | `false` | `true` |

## Configuración de ClickHouse

| Variable | Descripción | Valor por defecto | Ejemplo |
| --- | --- | --- | --- |
| `CLICKHOUSE_URL` | URL de la base de datos ClickHouse | - | `http://localhost:8123` |
| `CLICKHOUSE_USER` | Nombre de usuario de ClickHouse | - | `default` |
| `CLICKHOUSE_PASSWORD` | Contraseña de ClickHouse | - | `your-password` |
| `CLICKHOUSE_DATABASE` | Nombre de la base de datos ClickHouse | - | `tianji` |
| `CLICKHOUSE_DEBUG` | Activar depuración de ClickHouse | `false` | `true` |
| `CLICKHOUSE_DISABLE_SYNC` | Desactivar sincronización de ClickHouse | `false` | `true` |
| `CLICKHOUSE_SYNC_BATCH_SIZE` | Tamaño de lote de sincronización | `10000` | `5000` |
| `CLICKHOUSE_ENABLE_FALLBACK` | Activar fallback de ClickHouse | `true` | `false` |
| `CLICKHOUSE_HEALTH_CHECK_INTERVAL` | Intervalo de verificación de salud (ms) | `30000` | `60000` |
| `CLICKHOUSE_MAX_CONSECUTIVE_FAILURES` | Máximo de fallas consecutivas | `3` | `5` |
| `CLICKHOUSE_RETRY_INTERVAL` | Intervalo de reintento (ms) | `5000` | `10000` |

## Sistema de facturación (LemonSqueezy)

| Variable | Descripción | Valor por defecto | Ejemplo |
| --- | --- | --- | --- |
| `ENABLE_BILLING` | Activar funcionalidad de facturación | `false` | `true` |
| `LEMON_SQUEEZY_SIGNATURE_SECRET` | Secreto de firma de webhook de LemonSqueezy | - | `your-signature-secret` |
| `LEMON_SQUEEZY_API_KEY` | Clave API de LemonSqueezy | - | `your-api-key` |
| `LEMON_SQUEEZY_STORE_ID` | ID de tienda en LemonSqueezy | - | `your-store-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_FREE_ID` | ID de variante de suscripción gratuita | - | `free-variant-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_PRO_ID` | ID de variante de suscripción pro | - | `pro-variant-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_TEAM_ID` | ID de variante de suscripción de equipo | - | `team-variant-id` |

## Configuración de Sandbox

| Variable | Descripción | Valor por defecto | Ejemplo |
| --- | --- | --- | --- |
| `USE_VM2` | Usar VM2 para ejecución en sandbox | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | Límite de memoria para sandbox (MB) | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Ruta personalizada al ejecutable de Puppeteer | - | `/usr/bin/chromium` |

## Integración de mapas

| Variable | Descripción | Valor por defecto | Ejemplo |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | Token de API de AMap (Gaode) | - | `your-amap-token` |
| `MAPBOX_TOKEN` | Token de API de Mapbox | - | `your-mapbox-token` |

## Telemetría

| Variable | Descripción | Valor por defecto | Ejemplo |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | Desactivar telemetría anónima | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | Nombre del script de seguimiento personalizado | - | `custom-tracker.js` |

## Configuración de variables de entorno

Puedes establecer estas variables de entorno de diferentes formas:

1. Configurarlas directamente en tu entorno de despliegue (Docker, Kubernetes, etc.)

2. Para despliegues en Docker, puedes usar variables de entorno en tu docker-compose.yml:

```yaml
services:
  tianji:
    image: moonrailgun/tianji:latest
    environment:
      - PORT=3000
      - ALLOW_REGISTER=true
```

## Valores booleanos

Para variables de entorno booleanas, puedes usar `"1"` o `"true"` para habilitar la característica, y omitir la variable o establecerla en cualquier otro valor para deshabilitarla.
