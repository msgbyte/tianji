---
sidebar_position: 1
_i18n_hash: ef9fc0eb6072a8f037b70ff2b56e12ae
---
# Tracker-Skript

## Installation

Um Website-Ereignisse zu verfolgen, müssen Sie nur ein einfaches Skript (< 2 KB) in Ihre Website einfügen.

Das Skript sieht wie folgt aus:

```html
<script async defer src="https://<Ihre-eigene-Domain>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

Sie können diesen Skript-Code aus Ihrer **Tianji**-Websiteliste erhalten.

## Ereignis melden

**Tianji** bietet eine einfache Möglichkeit, Benutzer-Klickereignisse zu melden. Es ist einfach, nachzuvollziehen, welche Aktionen der Benutzer mag und häufig verwendet.

Dies ist eine sehr gängige Methode in der Website-Analyse. Sie können es schnell nutzen, indem Sie **Tianji** verwenden.

### Grundlegende Nutzung

Nachdem Sie den Skript-Code in Ihre Website eingefügt haben, müssen Sie nur ein `data-tianji-event` im DOM-Attribut hinzufügen.

Zum Beispiel:

```html
<button data-tianji-event="submit-login-form">Anmelden</button>
```

Wenn ein Benutzer nun auf diese Schaltfläche klickt, erhält Ihr Dashboard ein neues Ereignis.

### Ereignisdaten anhängen

Sie können zusätzliche Daten an Ihre Ereignisse anhängen, indem Sie `data-tianji-event-{key}`-Attribute verwenden. Jedes Attribut, das diesem Muster entspricht, wird gesammelt und mit dem Ereignis gesendet.

```html
<button 
  data-tianji-event="purchase" 
  data-tianji-event-product="Premium Plan"
  data-tianji-event-price="99"
  data-tianji-event-currency="USD">
  Jetzt kaufen
</button>
```

Dies sendet ein Ereignis namens `purchase` mit den folgenden Daten:
```json
{
  "product": "Premium Plan",
  "price": "99",
  "currency": "USD"
}
```

### Link-Klicks verfolgen

Bei der Verwendung von `data-tianji-event` auf Anker (`<a>`) -Tags behandelt **Tianji** diese speziell, um sicherzustellen, dass das Ereignis vor der Navigation verfolgt wird:

```html
<a href="/pricing" data-tianji-event="view-pricing">Preise anzeigen</a>
```

Für interne Links (nicht in einem neuen Tab geöffnet) wird der Tracker:
1. Die Standardnavigation verhindern
2. Das Verfolgungsereignis senden
3. Nach Abschluss der Verfolgung zur Ziel-URL navigieren

Für externe Links oder Links mit `target="_blank"` wird das Ereignis verfolgt, ohne die Navigation zu blockieren.

### JavaScript-API

Nachdem das Tracker-Skript geladen ist, können Sie auch Ereignisse programmatisch unter Verwendung des `window.tianji`-Objekts verfolgen.

#### Benutzerdefinierte Ereignisse verfolgen

```javascript
// Einfaches Ereignisverfolgen
window.tianji.track('button-clicked');

// Ereignis mit benutzerdefinierten Daten
window.tianji.track('purchase', {
  product: 'Premium Plan',
  price: 99,
  currency: 'USD'
});

// Verfolgen mit benutzerdefiniertem Payload-Objekt
window.tianji.track({
  website: 'Ihre-Website-ID',
  name: 'benutzerdefiniertes-ereignis',
  data: { key: 'value' }
});

// Verfolgen mithilfe einer Funktion (erhält aktuelle Seiteninformationen)
window.tianji.track((payload) => ({
  ...payload,
  name: 'dynamisches-ereignis',
  data: { timestamp: Date.now() }
}));
```

#### Benutzer identifizieren

Sie können Benutzerdaten an Session-Tracking anhängen:

```javascript
window.tianji.identify({
  userId: 'user-123',
  email: 'user@example.com',
  plan: 'premium'
});
```

Diese Informationen werden mit nachfolgenden Ereignissen dieses Benutzers verbunden.

## Standardmäßigen Skriptnamen ändern

> Diese Funktion ist verfügbar ab v1.7.4+

Sie können die Umgebung `CUSTOM_TRACKER_SCRIPT_NAME` verwenden, wenn Sie damit starten

zum Beispiel:
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

dann können Sie Ihr Tracker-Skript mit `"https://<Ihre-eigene-Domain>/my-tracker.js"` besuchen.

Dies soll Ihnen helfen, einige Werbeblocker zu umgehen.

Sie benötigen nicht das `.js`-Suffix. Es kann jeder beliebige Pfad sein, den Sie wählen, sogar `CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"`.

## Nur bestimmte Domains verfolgen

Im Allgemeinen wird der Tracker alle Ereignisse melden, wo immer Ihre Seite läuft. Aber manchmal müssen wir Ereignisse wie `localhost` ignorieren.

Tianji bietet ein Attribut des Tracker-Skripts, um dies zu tun.

Sie können `data-domains` in Ihr Skript hinzufügen. Der Wert sollte Ihre Root-Domains zum Verfolgen sein. Verwenden Sie `,` um mehrere Domains zu trennen.

```html
<script async defer src="https://<Ihre-eigene-Domain>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

Dann können Sie nur die Ereignisse von diesen Domains sehen.
