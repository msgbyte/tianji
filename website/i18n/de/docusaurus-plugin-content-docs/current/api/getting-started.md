---
sidebar_position: 1
_i18n_hash: 2a8dfc997c42846304cde1b51f4d6145
---
# Erste Schritte mit der API

Tianji bietet eine vollständige REST-API, mit der Sie programmatisch auf alle Funktionen von Tianji zugreifen und diese bedienen können. Dieser Leitfaden hilft Ihnen, schnell mit der Tianji-API zu starten.

## Überblick

Die Tianji-API basiert auf der REST-Architektur und verwendet das JSON-Format für den Datenaustausch. Alle API-Anfragen müssen über HTTPS erfolgen und erfordern eine entsprechende Authentifizierung.

### API-Basis-URL

```bash
https://your-tianji-domain.com/open
```

### Unterstützte Funktionen

Über die Tianji-API können Sie:

- Website-Analysedaten verwalten
- Überwachungsprojekte erstellen und verwalten
- Serverstatusinformationen abrufen
- Umfragen verwalten
- Telemetriedaten betreiben
- Arbeitsräume erstellen und verwalten

## Schnellstart

### 1. API-Schlüssel erhalten

Bevor Sie die API verwenden, müssen Sie einen API-Schlüssel erhalten:

1. Melden Sie sich bei Ihrer Tianji-Instanz an
2. Klicken Sie auf Ihr Avatar in der oberen rechten Ecke
3. Finden Sie den Bereich **API-Schlüssel**
4. Klicken Sie auf die Schaltfläche +, um einen neuen API-Schlüssel zu erstellen
5. Benennen Sie Ihren API-Schlüssel und speichern Sie ihn

### 2. OpenAPI aktivieren

Stellen Sie sicher, dass Ihre Tianji-Instanz den Zugang zu OpenAPI aktiviert hat:

Setzen Sie dies in Ihren Umgebungsvariablen:
```bash
ALLOW_OPENAPI=true
```

### 3. Erster API-Aufruf

Testen Sie Ihre API-Verbindung mit curl:

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json"
```

## Nächste Schritte

- Überprüfen Sie die [Authentifizierungsdokumentation](./authentication.md) für detaillierte Authentifizierungsmethoden
- Durchstöbern Sie die [API-Referenzdokumentation](/api) für alle verfügbaren Endpunkte
- Verwenden Sie das [OpenAPI SDK](./openapi-sdk.md) für typsichere API-Aufrufe
