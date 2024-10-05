---
sidebar_position: 1
_i18n_hash: bcb6522b66b64594f82548e296f77934
---
# Tracker-Skript

## Installation

Um Website-Ereignisse zu verfolgen, musst du nur ein einfaches Skript (< 2 KB) in deine Website einbinden.

Das Skript sieht wie folgt aus:

```html
<script async defer src="https://<your-self-hosted-domain>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

Du kannst diesen Skriptcode aus deiner **Tianji**-Websiteliste abrufen.

## Ereignisbericht

**Tianji** bietet eine einfache Möglichkeit, Benutzerklickereignisse zu melden. Es hilft dir, zu verfolgen, welche Aktionen Benutzer mögen und häufig verwenden.

Dies ist eine sehr häufige Methode in der Website-Analyse. Du kannst sie schnell mit **Tianji** nutzen.

Nachdem du den Skriptcode in deine Website eingebunden hast, musst du nur ein `data-tianji-event` in das DOM-Attribut einfügen.

Zum Beispiel:

```html
<button data-tianji-event="submit-login-form">Login</button>
```

Jetzt, wenn ein Benutzer auf diese Schaltfläche klickt, erhält dein Dashboard ein neues Ereignis.

## Standard-Skriptnamen ändern

> Diese Funktion ist ab v1.7.4 verfügbar.

Du kannst die Umgebungsvariable `CUSTOM_TRACKER_SCRIPT_NAME` beim Starten verwenden.

Zum Beispiel:
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

Dann kannst du auf dein Tracker-Skript über `"https://<your-self-hosted-domain>/my-tracker.js"` zugreifen.

Dies hilft dir, einige Werbeblocker zu umgehen.

Du benötigst nicht die `.js`-Endung. Es kann ein beliebiger Pfad sein, du kannst sogar `CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"` verwenden.

## Nur bestimmte Domains verfolgen

Im Allgemeinen meldet der Tracker alle Ereignisse, unabhängig davon, wo deine Website läuft. Manchmal müssen wir jedoch Ereignisse wie `localhost` ignorieren.

Tianji bietet ein Attribut für das Tracker-Skript, um dies zu tun.

Du kannst `data-domains` in dein Skript einfügen. Der Wert sollte deine Stammdomains sein, die verfolgt werden sollen. Verwende `,` um mehrere Domains zu trennen.

```html
<script async defer src="https://<your-self-hosted-domain>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

Dann kannst du nur die Ereignisse von diesen Domains sehen.
