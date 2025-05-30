---
sidebar_position: 1
_i18n_hash: a144af118d2aa2c5e95b1cee1897ae7a
---
# API Erste Schritte

Tianji bietet eine vollständige REST-API, die Ihnen ermöglicht, programmatisch auf alle Funktionen von Tianji zuzugreifen und diese zu bedienen. Dieser Leitfaden hilft Ihnen, schnell mit der Tianji-API zu beginnen.

## Überblick

Die Tianji-API basiert auf der REST-Architektur und verwendet das JSON-Format für den Datenaustausch. Alle API-Anfragen müssen über HTTPS gestellt werden und erfordern eine ordnungsgemäße Authentifizierung.

### API-Basis-URL

```bash
https://your-tianji-domain.com/open
```

### Unterstützte Funktionen

Über die Tianji-API können Sie:

- Website-Analysedaten verwalten
- Überwachungsprojekte erstellen und verwalten
- Informationen zum Serverstatus abrufen
- Umfragen verwalten
- Telemetriedaten bearbeiten
- Arbeitsbereiche erstellen und verwalten

## Schnellstart

### 1. API-Schlüssel erhalten

Bevor Sie die API verwenden, müssen Sie einen API-Schlüssel erhalten:

1. Melden Sie sich bei Ihrem Tianji-Exemplar an
2. Klicken Sie auf Ihr Avatar in der oberen rechten Ecke
3. Suchen Sie den Abschnitt **API-Keys**
4. Klicken Sie auf die + Schaltfläche, um einen neuen API-Schlüssel zu erstellen
5. Benennen Sie Ihren API-Schlüssel und speichern Sie ihn

### 2. OpenAPI aktivieren

Stellen Sie sicher, dass Ihr Tianji-Exemplar den OpenAPI-Zugriff aktiviert hat:

Setzen Sie in Ihren Umgebungsvariablen:
```bash
ALLOW_OPENAPI=true
```

### 3. Erster API-Aufruf

Testen Sie Ihre API-Verbindung mit curl:

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer YOUR_API_KEY" \
  -H "Content-Type: application/json"
```

## Nächste Schritte

- Überprüfen Sie die [Authentifizierungsdokumentation](./authentication.md) für detaillierte Authentifizierungsmethoden
- Stöbern Sie in der [API-Referenzdokumentation](/api) nach allen verfügbaren Endpunkten
- Verwenden Sie das [OpenAPI SDK](./openapi-sdk.md) für typsichere API-Aufrufe
