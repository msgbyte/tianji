---
sidebar_position: 10
_i18n_hash: f4200354a00e07423992df3afe66f818
---
# Umgebungsvariablen

Tianji unterstützt verschiedene Umgebungsvariablen zur Anpassung seines Verhaltens. Sie können diese Variablen im `env`-Feld Ihrer Docker Compose-Datei oder über Ihre Bereitstellungsumgebung konfigurieren.

## Grundkonfiguration

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `PORT` | Server-Port | `12345` | `3000` |
| `JWT_SECRET` | Geheimnis für JWT-Tokens | Zufälliger Text | `your-secret-key` |
| `ALLOW_REGISTER` | Benutzerregistrierung aktivieren | `false` | `true` |
| `ALLOW_OPENAPI` | OpenAPI-Zugriff aktivieren | `true` | `false` |
| `WEBSITE_ID` | Website-Kennung | - | `your-website-id` |
| `DISABLE_AUTO_CLEAR` | Automatische Datenbereinigung deaktivieren | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | Zugriffprotokolle deaktivieren | `false` | `true` |
| `DB_DEBUG` | Datenbank-Debugging aktivieren | `false` | `true` |

## Authentifizierung

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | Konto-basierte Authentifizierung deaktivieren | `false` | `true` |
| `AUTH_SECRET` | Authentifizierungsgeheimnis | MD5 des JWT-Geheimnisses | `your-auth-secret` |
| `AUTH_RESTRICT_EMAIL` | Registrierung auf spezifische E-Mail-Domains beschränken | - | `@example.com` |

### E-Mail-Authentifizierung und E-Mail-Einladung

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `EMAIL_SERVER` | SMTP-Server für E-Mail | - | `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | Absenderadresse der E-Mail | - | `noreply@example.com` |

### GitHub-Authentifizierung

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `AUTH_GITHUB_ID` | GitHub OAuth-Client-ID | - | `your-github-client-id` |
| `AUTH_GITHUB_SECRET` | GitHub OAuth-Client-Geheimnis | - | `your-github-client-secret` |

### Google-Authentifizierung

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `AUTH_GOOGLE_ID` | Google OAuth-Client-ID | - | `your-google-client-id` |
| `AUTH_GOOGLE_SECRET` | Google OAuth-Client-Geheimnis | - | `your-google-client-secret` |

### Benutzerdefinierte OAuth/OIDC-Authentifizierung

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `AUTH_CUSTOM_ID` | Benutzerdefinierte OAuth/OIDC-Client-ID | - | `your-custom-client-id` |
| `AUTH_CUSTOM_SECRET` | Benutzerdefiniertes OAuth/OIDC-Client-Geheimnis | - | `your-custom-client-secret` |
| `AUTH_CUSTOM_NAME` | Name des benutzerdefinierten Anbieters | `Custom` | `Enterprise SSO` |
| `AUTH_CUSTOM_TYPE` | Authentifizierungstyp | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUER` | OIDC-Aussteller-URL | - | `https://auth.example.com` |

## KI-Funktionen

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `SHARED_OPENAI_API_KEY` | OpenAI API-Schlüssel | - | `your-openai-api-key` |
| `SHARED_OPENAI_BASE_URL` | Benutzerdefinierte OpenAI API-URL | - | `https://api.openai.com/v1` |
| `SHARED_OPENAI_MODEL_NAME` | OpenAI-Modell zur Nutzung | `gpt-4o` | `gpt-3.5-turbo` |
| `DEBUG_AI_FEATURE` | KI-Funktionen debuggen | `false` | `true` |

## Sandbox-Konfiguration

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `USE_VM2` | VM2 für Sandbox-Ausführung verwenden | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | Speicherlimit für Sandbox (MB) | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Benutzerdefinierter Pfad zur Puppeteer-Ausführungsdatei | - | `/usr/bin/chromium` |

## Kartenintegration

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | AMap (Gaode) API-Token | - | `your-amap-token` |
| `MAPBOX_TOKEN` | Mapbox API-Token | - | `your-mapbox-token` |

## Telemetrie

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | Anonyme Telemetrie deaktivieren | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | Name des benutzerdefinierten Trackerskripts | - | `custom-tracker.js` |

## Festlegen von Umgebungsvariablen

Sie können diese Umgebungsvariablen auf verschiedene Weise festlegen:

1. Setzen Sie sie direkt in Ihrer Bereitstellungsumgebung (Docker, Kubernetes, etc.)

2. Für Docker-Bereitstellungen können Sie Umgebungsvariablen in Ihrer docker-compose.yml verwenden:

```yaml
services:
  tianji:
    image: moonrailgun/tianji:latest
    environment:
      - PORT=3000
      - ALLOW_REGISTER=true
```

## Boolesche Werte

Für boolesche Umgebungsvariablen können Sie entweder `"1"` oder `"true"` verwenden, um die Funktion zu aktivieren, und entweder die Variable weglassen oder auf einen anderen Wert setzen, um sie zu deaktivieren.
