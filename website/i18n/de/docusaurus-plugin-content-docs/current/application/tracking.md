---
sidebar_position: 1
_i18n_hash: ae151f338aa838eaab15a19bfea78d7f
---
# Anwendungstracking

Tianji bietet ein leistungsstarkes SDK zum Verfolgen von Ereignissen und Benutzerverhalten in Ihren Anwendungen. Diese Anleitung erklärt, wie Sie das Application Tracking SDK in Ihre Projekte integrieren und verwenden.

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

Bevor Sie Tracking-Funktionen verwenden, müssen Sie das Application SDK mit Ihrer Tianji-Server-URL und der Anwendungs-ID initialisieren:

```ts
import { initApplication } from 'tianji-react-native';

initApplication({
  serverUrl: 'https://tianji.example.com',  // Ihre Tianji-Server-URL
  applicationId: 'your-application-id'      // Ihre Anwendungs-ID
});
```

## Ereignisverfolgung

Sie können benutzerdefinierte Ereignisse in Ihrer Anwendung verfolgen, um Benutzeraktionen und -verhalten zu überwachen:

```ts
import { reportApplicationEvent } from 'tianji-react-native';

// Einfaches Ereignis verfolgen
reportApplicationEvent('Button Clicked');

// Ereignis mit zusätzlichen Daten verfolgen
reportApplicationEvent('Purchase Completed', {
  productId: 'product-123',
  price: 29.99,
  currency: 'USD'
});
```

## Bildschirmverfolgung

Verfolgen Sie Bildschirmaufrufe in Ihrer Anwendung, um Benutzer-Navigationsmuster zu verstehen:

### Aktuellen Bildschirm festlegen

Sie können die aktuellen Bildschirminformationen festlegen, die in nachfolgenden Ereignissen enthalten sind:

```ts
import { updateCurrentApplicationScreen } from 'tianji-react-native';

// Aktuellen Bildschirm aktualisieren, wenn der Benutzer navigiert
updateCurrentApplicationScreen('ProductDetails', { productId: 'product-123' });
```

### Bildschirmansichten berichten

Berichten Sie explizit über Bildschirmansichtsereignisse:

```ts
import { reportApplicationScreenView } from 'tianji-react-native';

// Aktuelle Bildschirmansicht berichten
reportApplicationScreenView();

// Oder eine spezifische Bildschirmansicht berichten
reportApplicationScreenView('Checkout', { cartItems: 3 });
```

## Benutzeridentifikation

Identifizieren Sie Benutzer in Ihrer Anwendung, um ihr Verhalten über Sitzungen hinweg zu verfolgen:

```ts
import { identifyApplicationUser } from 'tianji-react-native';

// Identifizieren Sie einen Benutzer mit seinen Informationen
identifyApplicationUser({
  id: 'user-123',           // Eindeutiger Benutzeridentifikator
  email: 'user@example.com',
  name: 'John Doe',
  // Fügen Sie beliebige andere Benutzereigenschaften hinzu
  plan: 'premium',
  signupDate: '2023-01-15'
});
```

## API-Referenz

### `initApplication(options)`

Initialisiert das Application Tracking SDK.

**Parameter:**

- `options`: ApplicationTrackingOptions
  - `serverUrl`: Ihre Tianji-Server-URL (z.B. 'https://tianji.example.com')
  - `applicationId`: Ihre Anwendungs-ID

### `reportApplicationEvent(eventName, eventData?, screenName?, screenParams?)`

Sendet ein Anwendungsereignis an den Tianji-Server.

**Parameter:**

- `eventName`: Name des Ereignisses (max. 50 Zeichen)
- `eventData`: (Optional) Ereignisdatenobjekt
- `screenName`: (Optional) Bildschirmname zur Überschreibung des aktuellen Bildschirms
- `screenParams`: (Optional) Bildschirmparameter zur Überschreibung der aktuellen Bildschirmparameter

### `updateCurrentApplicationScreen(name, params)`

Aktualisiert die Informationen zum aktuellen Anwendungsbildschirm.

**Parameter:**

- `name`: Bildschirmname
- `params`: Bildschirmparameterobjekt

### `reportApplicationScreenView(screenName?, screenParams?)`

Sendet ein Bildschirmansichtsereignis an den Tianji-Server.

**Parameter:**

- `screenName`: (Optional) Bildschirmname zur Überschreibung des aktuellen Bildschirms
- `screenParams`: (Optional) Bildschirmparameter zur Überschreibung der aktuellen Bildschirmparameter

### `identifyApplicationUser(userInfo)`

Identifiziert einen Benutzer in der Anwendung.

**Parameter:**

- `userInfo`: Datenobjekt zur Benutzeridentifikation

## Nutzlastbeschränkungen

- Sprachinformationen: max. 35 Zeichen
- Betriebssysteminformationen: max. 20 Zeichen
- URL-Informationen: max. 500 Zeichen
- Ereignisname: max. 50 Zeichen
