---
sidebar_position: 1
_i18n_hash: 21ae6837de110e1b576fdf570bbbea6c
---
# Tracker-Skript

## Installation

Um Website-Ereignisse zu verfolgen, müssen Sie lediglich ein einfaches Skript (< 2 KB) in Ihre Website einfügen.

Das Skript sieht wie folgt aus:

```html
<script async defer src="https://<Ihr-selbst-gehosteter-Domain>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

Sie können diesen Skriptcode von Ihrer **Tianji**-Website-Liste erhalten.

## Skriptattribute

Das Tracker-Skript unterstützt die folgenden `data-*` Attribute im `<script>` Tag:

| Attribut | Erforderlich | Standardwert | Beschreibung |
|---|---|---|---|
| `data-website-id` | **Ja** | — | Die eindeutige Website-ID zur Verknüpfung von Tracking-Daten. Der Tracker wird ohne dies nicht initialisiert. |
| `data-host-url` | Nein | Skript `src` Ursprung | Die URL des Backend-Servers. Wenn weggelassen, wird es automatisch aus dem `src` Pfad des Skripts abgeleitet. |
| `data-auto-track` | Nein | `true` | Automatische Verfolgung von Seitenansichten und Routenänderungen. Setzen Sie es auf `"false"`, um es zu deaktivieren. |
| `data-do-not-track` | Nein | — | Bei Einstellung respektiert es die Do Not Track (DNT)-Einstellung des Browsers und deaktiviert das Tracking, wenn DNT aktiviert ist. |
| `data-domains` | Nein | — | Eine kommagetrennte Liste von Domains, die verfolgt werden sollen (z.B. `"example.com,www.example.com"`). Das Tracking ist nur aktiv, wenn der aktuelle Hostname mit einer dieser Domains übereinstimmt. |

### Vollständiges Beispiel

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

### Deaktivieren des Trackings über localStorage

Sie können das Tracking auch zur Laufzeit deaktivieren, indem Sie ein localStorage-Flag setzen:

```javascript
localStorage.setItem('tianji.disabled', '1');
```

## Ereignisbericht

**Tianji** bietet eine einfache Möglichkeit, Benutzer-Klickereignisse zu melden. Es ist einfach, Ihnen zu helfen, nachzuvollziehen, welche Aktion der Benutzer mag und oft verwendet.

Dies ist eine sehr gängige Methode in der Website-Analyse. Sie können sie schnell nutzen, indem Sie **Tianji** verwenden.

### Grundlegende Nutzung

Nachdem Sie den Skriptcode in Ihre Website eingefügt haben, müssen Sie lediglich ein `data-tianji-event` im DOM-Attribut hinzufügen.

Zum Beispiel:

```html
<button data-tianji-event="submit-login-form">Login</button>
```

Jetzt, wenn der Benutzer auf diese Schaltfläche klickt, erhält Ihr Dashboard ein neues Ereignis.

### Anfügen von Ereignisdaten

Sie können zusätzliche Daten an Ihre Ereignisse anhängen, indem Sie `data-tianji-event-{key}` Attribute verwenden. Jedes Attribut, das diesem Muster entspricht, wird erfasst und mit dem Ereignis gesendet.

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

### Tracking von Link-Klicks

Beim Verwenden von `data-tianji-event` auf Anker- (`<a>`) Tags behandelt **Tianji** sie speziell, um sicherzustellen, dass das Ereignis vor der Navigation verfolgt wird:

```html
<a href="/pricing" data-tianji-event="view-pricing">Preise überprüfen</a>
```

Für interne Links (nicht in neuem Tab öffnen) wird der Tracker:

1. Die Standardnavigation verhindern
2. Das Tracking-Ereignis senden
3. Zur Ziel-URL navigieren, nachdem das Tracking abgeschlossen ist

Für externe Links oder Links mit `target="_blank"` wird das Ereignis verfolgt, ohne die Navigation zu blockieren.

### JavaScript-API

Nach dem Laden des Trackerskripts können Sie Ereignisse auch programmgesteuert über das `window.tianji` Objekt verfolgen.

#### Verfolgen von benutzerdefinierten Ereignissen

```javascript
// Einfaches Ereignistracking
window.tianji.track('button-clicked');

// Ereignis mit benutzerdefinierten Daten
window.tianji.track('purchase', {
  product: 'Premium Plan',
  price: 99,
  currency: 'USD'
});

// Tracking mit benutzerdefiniertem Payload-Objekt
window.tianji.track({
  website: 'your-website-id',
  name: 'custom-event',
  data: { key: 'value' }
});

// Tracking mit einer Funktion (erhält aktuelle Seiteninformationen)
window.tianji.track((payload) => ({
  ...payload,
  name: 'dynamic-event',
  data: { timestamp: Date.now() }
}));
```

#### Identifizieren von Benutzern

Sie können Benutzerinformationen an Tracking-Sitzungen anhängen:

```javascript
window.tianji.identify({
  userId: 'user-123',
  email: 'user@example.com',
  plan: 'premium'
});
```

Diese Informationen werden mit nachfolgenden Ereignissen von diesem Benutzer verknüpft.

## Standard-Skriptname ändern

> Diese Funktion ist in Version v1.7.4+ verfügbar.

Sie können die Umgebung `CUSTOM_TRACKER_SCRIPT_NAME` verwenden, wenn Sie es starten.

Zum Beispiel:
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

dann können Sie Ihr Tracker-Skript mit `"https://<your-self-hosted-domain>/my-tracker.js"` besuchen.

Dies soll Ihnen helfen, einige Ad-Blocker zu umgehen.

Sie benötigen nicht das `.js` Suffix. Es kann jeder Pfad sein, den Sie wählen, und Sie können sogar `CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"` verwenden.

## Ausschließlich für bestimmte Domains verfolgen

Im Allgemeinen wird der Tracker alle Ereignisse protokollieren, wo immer Ihre Website läuft. Aber manchmal müssen wir Ereignisse wie `localhost` ignorieren.

Tianji bietet ein Attribut im Tracker-Skript, um dies zu tun.

Sie können `data-domains` zu Ihrem Skript hinzufügen. Der Wert sollte Ihre Root-Domains für das Tracking sein. Verwenden Sie `,` um mehrere Domains zu trennen.

```html
<script async defer src="https://<Ihr-selbst-gehosteter-Domain>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

Dann können Sie nur die Ereignisse von diesen Domains sehen.
