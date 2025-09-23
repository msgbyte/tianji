---
sidebar_position: 10
_i18n_hash: a89f05aed50f89d55367e4d1d6598373
---
# Umgebungsvariablen

Tianji unterstützt verschiedene Umgebungsvariablen zur Anpassung seines Verhaltens. Sie können diese Variablen in Ihrem Docker Compose `env` Feld oder über Ihre Bereitstellungsumgebung konfigurieren.

## Grundkonfiguration

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `PORT` | Serverport | `12345` | `3000` |
| `JWT_SECRET` | Geheimnis für JWT-Tokens | Zufälliger Text | `dein-geheimnis-schlüssel` |
| `ALLOW_REGISTER` | Benutzerregistrierung aktivieren | `false` | `true` |
| `ALLOW_OPENAPI` | OpenAPI-Zugriff aktivieren | `true` | `false` |
| `WEBSITE_ID` | Website-Kennung | - | `deine-website-id` |
| `DISABLE_AUTO_CLEAR` | Automatische Datenbereinigung deaktivieren | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | Zugriffsprotokolle deaktivieren | `false` | `true` |
| `DB_DEBUG` | Datenbank-Debugging aktivieren | `false` | `true` |
| `ALPHA_MODE` | Alpha-Funktionen aktivieren | `false` | `true` |
| `ENABLE_FUNCTION_WORKER` | Funktionsarbeiter aktivieren | `false` | `true` |
| `REGISTER_AUTO_JOIN_WORKSPACE_ID` | Automatische Beitritts-ID für neue Benutzer | - | `arbeitsraum-id-123` |

## Cache-Konfiguration

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `CACHE_MEMORY_ONLY` | Nur-Speicher-Caching verwenden | `false` | `true` |
| `REDIS_URL` | Redis-Verbindungs-URL | - | `redis://localhost:6379` |

## Authentifizierung

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | Konto-basierte Authentifizierung deaktivieren | `false` | `true` |
| `AUTH_SECRET` | Authentifizierungsgeheimnis | MD5 des JWT-Geheimnisses | `dein-auth-geheimnis` |
| `AUTH_RESTRICT_EMAIL` | Registrierung auf bestimmte E-Mail-Domänen beschränken | - | `@example.com` |
| `AUTH_USE_SECURE_COOKIES` | Sichere Cookies für die Authentifizierung verwenden | `false` | `true` |

### E-Mail-Authentifizierung und Einladung

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `EMAIL_SERVER` | SMTP-Server für E-Mail | - | `smtp://user:pass@smtp.beispiel.de:587` |
| `EMAIL_FROM` | E-Mail-Absenderadresse | - | `noreply@beispiel.de` |

### GitHub-Authentifizierung

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `AUTH_GITHUB_ID` | GitHub OAuth-Client-ID | - | `deine-github-client-id` |
| `AUTH_GITHUB_SECRET` | GitHub OAuth-Client-Geheimnis | - | `dein-github-client-geheimnis` |

### Google-Authentifizierung

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `AUTH_GOOGLE_ID` | Google OAuth-Client-ID | - | `deine-google-client-id` |
| `AUTH_GOOGLE_SECRET` | Google OAuth-Client-Geheimnis | - | `dein-google-client-geheimnis` |

### Benutzerdefinierte OAuth/OIDC-Authentifizierung

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `AUTH_CUSTOM_ID` | Benutzerdefinierte OAuth/OIDC-Client-ID | - | `deine-benutzerdefinierte-client-id` |
| `AUTH_CUSTOM_SECRET` | Benutzerdefiniertes OAuth/OIDC-Client-Geheimnis | - | `dein-benutzerdefiniertes-client-geheimnis` |
| `AUTH_CUSTOM_NAME` | Name des benutzerdefinierten Anbieters | `Custom` | `Enterprise SSO` |
| `AUTH_CUSTOM_TYPE` | Authentifizierungstyp | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUER` | OIDC-Aussteller-URL | - | `https://auth.beispiel.de` |

## KI-Funktionen

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `SHARED_OPENAI_API_KEY` | OpenAI-API-Schlüssel | - | `dein-openai-api-key` |
| `SHARED_OPENAI_BASE_URL` | Benutzerdefinierte OpenAI-API-URL | - | `https://api.openai.com/v1` |
| `SHARED_OPENAI_MODEL_NAME` | OpenAI-Modell, das verwendet werden soll | `gpt-4o` | `gpt-3.5-turbo` |
| `SHARED_OPENAI_TOKEN_CALC_CONCURRENCY` | Token-Berechnungskonkurrenz | `5` | `10` |
| `DEBUG_AI_FEATURE` | KI-Funktionen debuggen | `false` | `true` |

## ClickHouse-Konfiguration

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `CLICKHOUSE_URL` | ClickHouse-Datenbank-URL | - | `http://localhost:8123` |
| `CLICKHOUSE_USER` | ClickHouse-Benutzername | - | `default` |
| `CLICKHOUSE_PASSWORD` | ClickHouse-Passwort | - | `dein-passwort` |
| `CLICKHOUSE_DATABASE` | ClickHouse-Datenbankname | - | `tianji` |
| `CLICKHOUSE_DEBUG` | ClickHouse-Debugging aktivieren | `false` | `true` |
| `CLICKHOUSE_DISABLE_SYNC` | ClickHouse-Synchronisation deaktivieren | `false` | `true` |
| `CLICKHOUSE_SYNC_BATCH_SIZE` | Synchronisations-Batchgröße | `10000` | `5000` |
| `CLICKHOUSE_ENABLE_FALLBACK` | ClickHouse-Fallback aktivieren | `true` | `false` |
| `CLICKHOUSE_HEALTH_CHECK_INTERVAL` | Gesundheitscheck-Intervall (ms) | `30000` | `60000` |
| `CLICKHOUSE_MAX_CONSECUTIVE_FAILURES` | Maximale aufeinanderfolgende Fehler | `3` | `5` |
| `CLICKHOUSE_RETRY_INTERVAL` | Wiederholungsintervall (ms) | `5000` | `10000` |

## Abrechnungssystem (LemonSqueezy)

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `ENABLE_BILLING` | Abrechnungsfunktionalität aktivieren | `false` | `true` |
| `LEMON_SQUEEZY_SIGNATURE_SECRET` | LemonSqueezy Webhook-Signaturgeheimnis | - | `dein-signatur-geheimnis` |
| `LEMON_SQUEEZY_API_KEY` | LemonSqueezy API-Schlüssel | - | `dein-api-schlüssel` |
| `LEMON_SQUEEZY_STORE_ID` | LemonSqueezy Shop-ID | - | `dein-shop-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_FREE_ID` | Varianten-ID für kostenlose Abonnementstufe | - | `kostenlose-variante-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_PRO_ID` | Varianten-ID für Pro-Abonnementstufe | - | `pro-variante-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_TEAM_ID` | Varianten-ID für Team-Abonnementstufe | - | `team-variante-id` |

## Sandbox-Konfiguration

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `USE_VM2` | VM2 für Sandbox-Ausführung verwenden | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | Speicherlimit für Sandbox (MB) | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Benutzerdefinierter Pfad zur Puppeteer-Ausführbaren Datei | - | `/usr/bin/chromium` |

## Kartenintegration

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | AMap (Gaode) API-Token | - | `dein-amap-token` |
| `MAPBOX_TOKEN` | Mapbox API-Token | - | `dein-mapbox-token` |

## Telemetrie

| Variable | Beschreibung | Standard | Beispiel |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | Anonyme Telemetrie deaktivieren | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | Benutzerdefinierter Tracker-Skriptname | - | `custom-tracker.js` |

## Festlegen von Umgebungsvariablen

Sie können diese Umgebungsvariablen auf verschiedene Weise festlegen:

1. Direkt in Ihrer Bereitstellungsumgebung festlegen (Docker, Kubernetes, etc.)

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

Für boolesche Umgebungsvariablen können Sie entweder `"1"` oder `"true"` verwenden, um die Funktion zu aktivieren, oder die Variable weglassen oder auf einen anderen Wert setzen, um sie zu deaktivieren.
