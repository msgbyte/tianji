---
sidebar_position: 1
_i18n_hash: ef9fc0eb6072a8f037b70ff2b56e12ae
---
# Script de Rastreo

## Instalación

Para rastrear los eventos de un sitio web, solo necesitas inyectar un script sencillo (< 2 KB) en tu sitio web.

El script se ve como a continuación:

```html
<script async defer src="https://<tu-dominio-autohospedado>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

Puedes obtener este código de script desde la lista del sitio web de **Tianji**.

## Reportar Evento

**Tianji** proporciona una forma sencilla de reportar eventos de clic del usuario, es fácil ayudarte a rastrear qué acción le gusta al usuario y suele utilizar.

Este es un método muy común en el análisis web. Puedes obtener rápidamente usarlo con **Tianji**.

### Uso Básico

Después de inyectar el código del script en tu sitio web, solo necesitas añadir un `data-tianji-event` en el atributo DOM.

Por ejemplo:

```html
<button data-tianji-event="submit-login-form">Login</button>
```

Ahora, cuando el usuario haga clic en este botón, tu panel recibirá un nuevo evento.

### Adjuntar Datos al Evento

Puedes adjuntar datos adicionales a tus eventos usando los atributos `data-tianji-event-{clave}`. Cualquier atributo que coincida con este patrón será recolectado y enviado con el evento.

```html
<button 
  data-tianji-event="purchase" 
  data-tianji-event-product="Premium Plan"
  data-tianji-event-price="99"
  data-tianji-event-currency="USD">
  Buy Now
</button>
```

Esto enviará un evento llamado `purchase` con los siguientes datos:
```json
{
  "product": "Premium Plan",
  "price": "99",
  "currency": "USD"
}
```

### Rastrear Clics en Enlaces

Al usar `data-tianji-event` en etiquetas de anclaje (`<a>`), **Tianji** las maneja especialmente para asegurar que el evento sea rastreado antes de la navegación:

```html
<a href="/pricing" data-tianji-event="view-pricing">Check Pricing</a>
```

Para enlaces internos (no se abre en una nueva pestaña), el rastreador:
1. Previene la navegación por defecto.
2. Envía el evento de rastreo.
3. Navega a la URL de destino después de que el rastreo se complete.

Para enlaces externos o enlaces con `target="_blank"`, el evento se rastrea sin bloquear la navegación.

### API de JavaScript

Después de que se cargue el script del rastreador, también puedes rastrear eventos programáticamente usando el objeto `window.tianji`.

#### Rastrear Eventos Personalizados

```javascript
// Rastreo de evento simple
window.tianji.track('button-clicked');

// Evento con datos personalizados
window.tianji.track('purchase', {
  product: 'Premium Plan',
  price: 99,
  currency: 'USD'
});

// Rastrear con objeto de carga útil personalizado
window.tianji.track({
  website: 'your-website-id',
  name: 'custom-event',
  data: { key: 'value' }
});

// Rastrear usando una función (recibe información de la página actual)
window.tianji.track((payload) => ({
  ...payload,
  name: 'dynamic-event',
  data: { timestamp: Date.now() }
}));
```

#### Identificar Usuarios

Puedes adjuntar información del usuario a las sesiones de rastreo:

```javascript
window.tianji.identify({
  userId: 'user-123',
  email: 'user@example.com',
  plan: 'premium'
});
```

Esta información se asociará con eventos subsiguientes de este usuario.

## Modificar el nombre del script predeterminado

> Esta función está disponible en la v1.7.4+

Puedes usar el entorno `CUSTOM_TRACKER_SCRIPT_NAME` cuando lo inicies.

Por ejemplo:
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

entonces podrás visitar tu script de rastreo con `"https://<tu-dominio-autohospedado>/my-tracker.js"`

Esto es para ayudarte a evitar algunos bloqueadores de publicidad.

No necesitas el sufijo `.js`. Puede ser cualquier ruta que elijas, incluso puedes usar como `CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"`

## Rastrear Solo Dominios Específicos

Generalmente, el rastreador reportará todos los eventos donde quiera que tu sitio esté corriendo. Pero a veces necesitamos ignorar eventos como `localhost`.

Tianji proporciona un atributo del script de rastreo para hacer eso.

Puedes añadir `data-domains` a tu script. El valor debe ser tus dominios raíz para rastrear. Usa `,` para separar múltiples dominios.

```html
<script async defer src="https://<tu-dominio-autohospedado>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

Entonces puedes ver solo los eventos de estos dominios.
