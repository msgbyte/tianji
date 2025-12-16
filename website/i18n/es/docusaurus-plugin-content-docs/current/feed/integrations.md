---
sidebar_position: 5
_i18n_hash: 2ebf85a054d427b1cfc8e50c237bede0
---
# Integraciones

Tianji proporciona adaptadores webhook integrados para convertir cargas útiles de terceros en eventos de Feed.

## GitHub

Punto de acceso

POST `/open/feed/{channelId}/github`

Notas

- Usa el tipo de contenido "application/json".
- El encabezado `X-GitHub-Event` es requerido por GitHub y consumido por el adaptador.
- Tipos soportados: `push`, `star`, `issues` (abiertos/cerrados). Otros serán registrados como desconocidos.

## Stripe

Punto de acceso

POST `/open/feed/{channelId}/stripe`

Notas

- Configura un endpoint de webhook de Stripe apuntando a la URL mencionada.
- Tipos soportados: `payment_intent.succeeded`, `payment_intent.canceled`, `customer.subscription.created`, `customer.subscription.deleted`.

## Sentry

Punto de acceso

POST `/open/feed/{channelId}/sentry`

Notas

- El encabezado `Sentry-Hook-Resource: event_alert` y la acción `triggered` son mapeados a eventos de Feed.
- Ver capturas de pantalla paso a paso en "Integración con Sentry".

## Tencent Cloud Alarm

Punto de acceso

POST `/open/feed/{channelId}/tencent-cloud/alarm`

Notas

- Soporta tipos de alarma `event` y `metric`. La carga útil se valida; las solicitudes inválidas son rechazadas.

## Webhook Playground

Punto de acceso

POST `/open/feed/playground/{workspaceId}`

Notas

- Los encabezados/cuerpo/método/ URL se reflejan en el playground en tiempo real del espacio de trabajo para depurar integraciones.
