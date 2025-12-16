---
sidebar_position: 1
_i18n_hash: c24c34a1a9df2ee5bd25253195dcba08
---
# Integración con Sentry

:::info
Obtén más información sobre Sentry en [sentry.io](https://sentry.io/)
:::

Haz clic en `Configuración` => `Integraciones` => `Crear nueva integración`

![](/img/docs/sentry/sentry1.png)

Crea una aplicación de `Integración Interna`

![](/img/docs/sentry/sentry2.png)

Ingresa el nombre `Tianji` e introduce la URL del webhook en el formulario.

![](/img/docs/sentry/sentry3.png)

No olvides habilitar `Acción de Regla de Alerta`

![](/img/docs/sentry/sentry4.png)

Luego, agrega permiso de lectura de problemas, y en el webhook agrega `problema` y `error`

![](/img/docs/sentry/sentry5.png)

Finalmente, puedes crear una regla de alerta y verás `Tianji` en la lista desplegable de la sección de notificaciones.

![](/img/docs/sentry/sentry6.png)
