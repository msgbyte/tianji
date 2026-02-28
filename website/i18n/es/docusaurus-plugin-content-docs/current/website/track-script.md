---
sidebar_position: 1
_i18n_hash: 21ae6837de110e1b576fdf570bbbea6c
---
# Script de Seguimiento

## Instalación

Para rastrear eventos en el sitio web, solo necesitas inyectar un script simple (< 2 KB) en tu sitio web.

El script se ve como se muestra a continuación:

```html
<script async defer src="https://<tu-dominio-autoalojado>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

Puedes obtener este código de script de tu lista de sitios web de **Tianji**.

## Atributos del Script

El script de seguimiento admite los siguientes atributos `data-*` en la etiqueta `<script>`:

| Atributo | Requerido | Predeterminado | Descripción |
|---|---|---|---|
| `data-website-id` | **Sí** | — | El ID único del sitio web para asociar datos de seguimiento. El rastreador no se inicializará sin esto. |
| `data-host-url` | No | Origen del `src` del script | La URL del servidor backend. Si se omite, se deriva automáticamente del camino `src` del script. |
| `data-auto-track` | No | `true` | Rastrear automáticamente las vistas de página y los cambios de ruta. Configurar en `"false"` para desactivar. |
| `data-do-not-track` | No | — | Cuando se establece, respeta la configuración de No Rastrear (DNT) del navegador y desactiva el seguimiento si DNT está habilitado. |
| `data-domains` | No | — | Una lista de dominios, separada por comas, para rastrear (por ejemplo, `"example.com,www.example.com"`). El seguimiento solo está activo cuando el nombre de host actual coincide con uno de estos dominios. |

### Ejemplo Completo

```html
<script
  async
  defer
  src="https://example.com/tracker.js"
  data-website-id="clxxxxxxxxxxxxxxxxxx"
  data-host-url="https://analytics.example.com"
  data-auto-track="true"
  data-do-not-track="true"
  data-domains="example.com,www.example.com"
></script>
```

### Deshabilitar el Seguimiento a través de localStorage

También puedes desactivar el seguimiento en tiempo de ejecución estableciendo un indicador localStorage:

```javascript
localStorage.setItem('tianji.disabled', '1');
```

## Reportar Evento

**Tianji** ofrece una forma sencilla de reportar eventos de clic de usuario, es fácil ayudarte a rastrear qué acciones les gustan y utilizan con frecuencia a los usuarios.

Este es un método muy común en el análisis de sitios web que puedes utilizar rápidamente con **Tianji**.

### Uso Básico

Después de inyectar el código del script en tu sitio web, solo necesitas agregar un `data-tianji-event` en el atributo del DOM.

por ejemplo:

```html
<button data-tianji-event="submit-login-form">Login</button>
```

Ahora, cuando el usuario haga clic en este botón, tu panel de control recibirá un nuevo evento.

### Adjuntar Datos del Evento

Puedes adjuntar datos adicionales a tus eventos usando los atributos `data-tianji-event-{key}`. Cualquier atributo que coincida con este patrón será recogido y enviado con el evento.

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

Al usar `data-tianji-event` en etiquetas de anclaje (`<a>`), **Tianji** los maneja especialmente para asegurarse de que el evento sea rastreado antes de la navegación:

```html
<a href="/pricing" data-tianji-event="view-pricing">Check Pricing</a>
```

Para enlaces internos (que no se abren en nueva pestaña), el rastreador:
1. Impide la navegación por defecto
2. Envía el evento de seguimiento
3. Navega a la URL de destino después de completar el seguimiento

Para enlaces externos o enlaces con `target="_blank"`, el evento se rastrea sin bloquear la navegación.

### API de JavaScript

Después de que el script del rastreador se haya cargado, también puedes rastrear eventos programáticamente usando el objeto `window.tianji`.

#### Rastrear Eventos Personalizados

```javascript
// Rastrear evento simple
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

Puedes adjuntar información del usuario a las sesiones de seguimiento:

```javascript
window.tianji.identify({
  userId: 'user-123',
  email: 'user@example.com',
  plan: 'premium'
});
```

Esta información se asociará con eventos subsecuentes de este usuario.

## Modificar el Nombre del Script por Defecto

> Esta característica está disponible en v1.7.4+

Puedes usar la variable de entorno `CUSTOM_TRACKER_SCRIPT_NAME` cuando la inicies

por ejemplo:
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

entonces puedes visitar tu script de rastreo con `"https://<tu-dominio-autoalojado>/my-tracker.js"`

Esto es para ayudarte a evitar algunos bloqueadores de anuncios.

No necesitas el sufijo `.js`. Puede ser cualquier ruta que elijas, incluso puedes usarlo como `CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"`.

## Rastrear Solo Dominios Específicos

Generalmente el rastreador reportará todos los eventos donde sea que tu sitio esté corriendo. Pero a veces necesitamos ignorar eventos como `localhost`.

Tianji proporciona un atributo del script de rastreo para hacer eso.

Puedes agregar `data-domains` a tu script. El valor debe ser tus dominios raíz para rastrear. Usa `,` para separar múltiples dominios.

```html
<script async defer src="https://<tu-dominio-autoalojado>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

Entonces solo podrás ver los eventos de estos dominios.
