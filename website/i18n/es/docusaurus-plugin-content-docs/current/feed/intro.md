---
sidebar_position: 0
_i18n_hash: 2279fcf53ed0422cb00d2f89e2a43ac7
---
# Resumen de Feed

Feed es un flujo de eventos ligero para tu espacio de trabajo. Ayuda a los equipos a agregar eventos importantes de diferentes sistemas en canales, colaborar en torno a incidentes, y mantener informados a los interesados.

## Conceptos

- Canal: Un flujo lógico para recopilar y organizar eventos. Cada canal puede estar conectado a uno o más objetivos de notificación y puede requerir opcionalmente una firma de webhook.
- Evento: Un registro único con nombre, contenido, etiquetas, fuente, identidad del remitente, importancia y carga útil opcional. Los eventos pueden ser archivados/desarchivados.
- Estado: Un tipo especial de evento en curso que puede ser insertado o actualizado repetidamente mediante un id de evento estable, y resuelto cuando termina.
- Integración: Adaptadores de webhook integrados que convierten cargas útiles de terceros (por ejemplo, GitHub, Stripe, Sentry, Tencent Cloud Alarm) en eventos de Feed.
- Notificación: Los canales pueden distribuir eventos a notificaciones configuradas; la frecuencia de entrega se puede ajustar según la configuración del canal.

## Casos de uso típicos

- Flujo de incidentes de producto e infraestructura a través de múltiples servicios
- Despliegues de CI/CD y avisos de lanzamiento
- Señales de facturación y suscripción
- Alertas de seguridad, monitoreo y errores
