---
sidebar_position: 1
_i18n_hash: fbe38264a49d1d3af45c4417fdc9a108
---
# Seguimiento de Aplicaciones

Tianji ofrece un potente SDK para rastrear eventos y el comportamiento de los usuarios en tus aplicaciones. Esta guía explica cómo integrar y utilizar el SDK de Seguimiento de Aplicaciones en tus proyectos.

## Instalación

Instala el SDK de Tianji para React Native en tu proyecto:

```bash
npm install tianji-react-native
# o
yarn add tianji-react-native
# o
pnpm add tianji-react-native
```

## Inicialización

Antes de utilizar cualquier función de seguimiento, necesitas inicializar el SDK de la aplicación con tu URL del servidor Tianji y el ID de la aplicación:

```ts
import { initApplication } from 'tianji-react-native';

initApplication({
  serverUrl: 'https://tianji.example.com',  // Tu URL del servidor Tianji
  applicationId: 'tu-id-de-aplicación'      // Tu identificador de aplicación
});
```

## Seguimiento de Eventos

Puedes rastrear eventos personalizados en tu aplicación para monitorear acciones y comportamientos de los usuarios:

```ts
import { reportApplicationEvent } from 'tianji-react-native';

// Rastrear un evento simple
reportApplicationEvent('Botón Clicado');

// Rastrear un evento con datos adicionales
reportApplicationEvent('Compra Completada', {
  productId: 'producto-123',
  price: 29.99,
  currency: 'USD'
});
```

## Seguimiento de Pantallas

Rastrea las vistas de pantalla en tu aplicación para comprender los patrones de navegación de los usuarios:

### Configurando la Pantalla Actual

Puedes establecer la información de la pantalla actual que se incluirá en los eventos subsecuentes:

```ts
import { updateCurrentApplicationScreen } from 'tianji-react-native';

// Actualizar pantalla actual cuando el usuario navega
updateCurrentApplicationScreen('DetallesProducto', { productId: 'producto-123' });
```

### Reportando Vistas de Pantalla

Reporta explícitamente eventos de vista de pantalla:

```ts
import { reportApplicationScreenView } from 'tianji-react-native';

// Reporta la vista de la pantalla actual
reportApplicationScreenView();

// O reporta una vista de pantalla específica
reportApplicationScreenView('Caja', { cartItems: 3 });
```

#### Integración con expo-router

```tsx
import { useGlobalSearchParams, usePathname } from 'expo-router'
import { reportApplicationScreenView } from 'tianji-react-native'

function App() {
  const pathname = usePathname()
  const params = useGlobalSearchParams()

  useEffect(() => {
    reportApplicationScreenView(pathname, params)
  }, [pathname, params])
}
```

## Identificación del Usuario

Identifica a los usuarios en tu aplicación para rastrear su comportamiento a través de sesiones:

```ts
import { identifyApplicationUser } from 'tianji-react-native';

// Identificar un usuario con su información
identifyApplicationUser({
  id: 'usuario-123',        // Identificador único del usuario
  email: 'usuario@ejemplo.com',
  name: 'John Doe',
  // Agrega cualquier otra propiedad del usuario
  plan: 'premium',
  signupDate: '2023-01-15'
});
```

## Referencia de la API

### `initApplication(options)`

Inicializa el SDK de seguimiento de aplicaciones.

**Parámetros:**

- `options`: ApplicationTrackingOptions
  - `serverUrl`: Tu URL del servidor Tianji (por ejemplo, 'https://tianji.example.com')
  - `applicationId`: Tu identificador de aplicación

### `reportApplicationEvent(eventName, eventData?, screenName?, screenParams?)`

Envía un evento de aplicación al servidor de Tianji.

**Parámetros:**

- `eventName`: Nombre del evento (máx. 50 caracteres)
- `eventData`: (Opcional) Objeto de datos del evento
- `screenName`: (Opcional) Nombre de la pantalla para sobrescribir la pantalla actual
- `screenParams`: (Opcional) Parámetros de la pantalla para sobrescribir los parámetros de la pantalla actual

### `updateCurrentApplicationScreen(name, params)`

Actualiza la información de la pantalla actual de la aplicación.

**Parámetros:**

- `name`: Nombre de la pantalla
- `params`: Objeto de parámetros de la pantalla

### `reportApplicationScreenView(screenName?, screenParams?)`

Envía un evento de vista de pantalla al servidor de Tianji.

**Parámetros:**

- `screenName`: (Opcional) Nombre de la pantalla para sobrescribir la pantalla actual
- `screenParams`: (Opcional) Parámetros de la pantalla para sobrescribir los parámetros de la pantalla actual

### `identifyApplicationUser(userInfo)`

Identifica un usuario en la aplicación.

**Parámetros:**

- `userInfo`: Objeto de datos de identificación del usuario

## Limitaciones de Carga Útil

- Información del idioma: máx. 35 caracteres
- Información del sistema operativo: máx. 20 caracteres
- Información del URL: máx. 500 caracteres
- Nombre del evento: máx. 50 caracteres
