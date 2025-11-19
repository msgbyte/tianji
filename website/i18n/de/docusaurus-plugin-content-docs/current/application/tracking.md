---
sidebar_position: 1
_i18n_hash: fbe38264a49d1d3af45c4417fdc9a108
---
# Anwendungs-Tracking

Tianji bietet ein leistungsstarkes SDK zur Verfolgung von Ereignissen und Benutzerverhalten in Ihren Anwendungen. Diese Anleitung erklärt, wie Sie das Application Tracking SDK in Ihre Projekte integrieren und verwenden.

## Installation

Installieren Sie das Tianji React Native SDK in Ihrem Projekt:

```bash
npm install tianji-react-native
# oder
yarn add tianji-react-native
# oder
pnpm add tianji-react-native
```

## Initialisierung

Bevor Sie Tracking-Funktionen nutzen können, müssen Sie das Application SDK mit Ihrer Tianji-Server-URL und Anwendungs-ID initialisieren:

```ts
import { initApplication } from 'tianji-react-native';

initApplication({
  serverUrl: 'https://tianji.example.com',  // Ihre Tianji-Server-URL
  applicationId: 'your-application-id'       // Ihre Anwendungs-ID
});
```

## Ereignis-Tracking

Sie können benutzerdefinierte Ereignisse in Ihrer Anwendung verfolgen, um Benutzeraktionen und -verhalten zu überwachen:

```ts
import { reportApplicationEvent } from 'tianji-react-native';

// Ein einfaches Ereignis verfolgen
reportApplicationEvent('Button Clicked');

// Ein Ereignis mit zusätzlichen Daten verfolgen
reportApplicationEvent('Purchase Completed', {
  productId: 'product-123',
  price: 29.99,
  currency: 'USD'
});
```

## Bildschirmverfolgung

Verfolgen Sie Bildschirmansichten in Ihrer Anwendung, um Navigationsmuster der Benutzer zu verstehen:

### Aktuellen Bildschirm festlegen

Sie können die aktuellen Bildschirmdaten festlegen, die in nachfolgenden Ereignissen enthalten sein werden:

```ts
import { updateCurrentApplicationScreen } from 'tianji-react-native';

// Aktuellen Bildschirm aktualisieren, wenn der Benutzer navigiert
updateCurrentApplicationScreen('ProductDetails', { productId: 'product-123' });
```

### Bildschirmansichten melden

Bildschirmansicht-Ereignisse explizit melden:

```ts
import { reportApplicationScreenView } from 'tianji-react-native';

// Aktuelle Bildschirmansicht melden
reportApplicationScreenView();

// Oder eine bestimmte Bildschirmansicht melden
reportApplicationScreenView('Checkout', { cartItems: 3 });
```

#### Integration mit expo-router

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

## Benutzeridentifikation

Identifizieren Sie Benutzer in Ihrer Anwendung, um ihr Verhalten über Sitzungen hinweg zu verfolgen:

```ts
import { identifyApplicationUser } from 'tianji-react-native';

// Einen Benutzer mit dessen Informationen identifizieren
identifyApplicationUser({
  id: 'user-123',          // Eindeutige Benutzerkennung
  email: 'user@example.com',
  name: 'John Doe',
  // Weitere Benutzerattribute hinzufügen
  plan: 'premium',
  signupDate: '2023-01-15'
});
```

## API-Referenz

### `initApplication(options)`

Initialisiert das Application Tracking SDK.

**Parameter:**

- `options`: ApplicationTrackingOptions
  - `serverUrl`: Ihre Tianji-Server-URL (z. B. 'https://tianji.example.com')
  - `applicationId`: Ihre Anwendungs-ID

### `reportApplicationEvent(eventName, eventData?, screenName?, screenParams?)`

Sendet ein Anwendungsevent an den Tianji-Server.

**Parameter:**

- `eventName`: Name des Ereignisses (max. 50 Zeichen)
- `eventData`: (Optional) Ereignisdatenobjekt
- `screenName`: (Optional) Bildschirmname zur Überschreibung des aktuellen Bildschirms
- `screenParams`: (Optional) Bildschirmparameter zur Überschreibung der aktuellen Bildschirmparameter

### `updateCurrentApplicationScreen(name, params)`

Aktualisiert die Informationen zum aktuellen Anwendungsscreen.

**Parameter:**

- `name`: Bildschirmname
- `params`: Bildschirmparameter-Objekt

### `reportApplicationScreenView(screenName?, screenParams?)`

Sendet ein Bildschirmansicht-Ereignis an den Tianji-Server.

**Parameter:**

- `screenName`: (Optional) Bildschirmname zur Überschreibung des aktuellen Bildschirms
- `screenParams`: (Optional) Bildschirmparameter zur Überschreibung der aktuellen Bildschirmparameter

### `identifyApplicationUser(userInfo)`

Identifiziert einen Benutzer in der Anwendung.

**Parameter:**

- `userInfo`: Benutzeridentifikationsdaten-Objekt

## Payload-Beschränkungen

- Sprachinformation: max. 35 Zeichen
- Betriebssysteminformation: max. 20 Zeichen
- URL-Information: max. 500 Zeichen
- Ereignisname: max. 50 Zeichen
