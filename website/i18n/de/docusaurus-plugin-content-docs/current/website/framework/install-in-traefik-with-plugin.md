---
sidebar_position: 2
_i18n_hash: 8142a07cc46361e9e72d8c883ab7869a
---
# Installation in Traefik mit Plugin

Tianji bietet ein Traefik-Plugin, das es Ihnen ermöglicht, die Website-Analyse-Funktionalität von Tianji einfach in Ihren Traefik-Proxy zu integrieren.

## Plugin-Übersicht

[traefik-tianji-plugin](https://github.com/msgbyte/traefik-tianji-plugin) ist ein speziell für Tianji entwickeltes Traefik-Middleware-Plugin, das das Tianji-Tracking-Skript automatisch in Ihre Website einfügen kann, ohne dass Sie Ihren Website-Code ändern müssen, um mit der Sammlung von Besucherdaten zu beginnen.

## Installation des Plugins

### 1. Plugin in der statischen Konfiguration hinzufügen

Zuerst müssen Sie den Plugin-Verweis in Traefiks statischer Konfiguration hinzufügen. Die Plugin-Versionsnummer verweist auf das Git-Tag.

#### YAML-Konfiguration

Fügen Sie das Folgende zu Ihrer `traefik.yml` oder statischen Konfigurationsdatei hinzu:

```yaml
experimental:
  plugins:
    traefik-tianji-plugin:
      moduleName: "github.com/msgbyte/traefik-tianji-plugin"
      version: "v0.2.1"
```

#### TOML-Konfiguration

```toml
[experimental.plugins.traefik-tianji-plugin]
  moduleName = "github.com/msgbyte/traefik-tianji-plugin"
  version = "v0.2.1"
```

#### Befehlszeile

```bash
--experimental.plugins.traefik-tianji-plugin.modulename=github.com/msgbyte/traefik-tianji-plugin
--experimental.plugins.traefik-tianji-plugin.version=v0.2.1
```

### 2. Middleware konfigurieren

Nach der Installation des Plugins müssen Sie die Middleware in der dynamischen Konfiguration einrichten.

#### YAML-Dynamische Konfiguration

In Ihrer `config.yml` oder dynamischen Konfigurationsdatei:

```yaml
http:
  middlewares:
    my-tianji-middleware:
      plugin:
        traefik-tianji-plugin:
          tianjiHost: "https://tianji.ihre-domain.com"
          websiteId: "ihre-website-id"
```

#### TOML-Dynamische Konfiguration

```toml
[http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin]
  tianjiHost = "https://tianji.ihre-domain.com"
  websiteId = "ihre-website-id"
```

#### Docker Compose Labels

```yaml
version: '3.7'
services:
  my-app:
    image: nginx:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.my-app.rule=Host(`my-app.local`)"
      - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.tianjiHost=https://tianji.ihre-domain.com"
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.websiteId=ihre-website-id"
```

## Konfigurationsparameter

### Erforderliche Parameter

- **tianjiHost**: Die vollständige URL Ihres Tianji-Servers
  - Beispiel: `https://tianji.ihre-domain.com`
  - Wenn Sie den offiziellen gehosteten Dienst nutzen: `https://app-tianji.msgbyte.com`

- **websiteId**: Die in Tianji erstellte Website-ID
  - Kann in den Website-Einstellungen Ihres Tianji-Admin-Panels gefunden werden

### Optionale Parameter

Das Plugin unterstützt auch andere Konfigurationsparameter zur Anpassung des Verhaltens. Für spezifische Parameter konsultieren Sie bitte die [GitHub Repository Dokumentation](https://github.com/msgbyte/traefik-tianji-plugin).

## Verwendung der Middleware

Nach der Konfiguration müssen Sie diese Middleware in Ihrem Router verwenden:

### YAML-Konfiguration

```yaml
http:
  routers:
    my-app:
      rule: "Host(`my-app.local`)"
      middlewares:
        - "my-tianji-middleware"
      service: "my-app-service"
```

### Docker Compose Labels

```yaml
labels:
  - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
```

## So funktioniert's

1. Wenn Anfragen den Traefik-Proxy passieren, überprüft das Plugin den Antwortinhalt
2. Wenn die Antwort HTML-Inhalte ist, fügt das Plugin das Tianji-Tracking-Skript automatisch ein
3. Das Skript beginnt mit der Sammlung von Besucherdaten und sendet sie beim Laden der Seite an den Tianji-Server

## Wichtige Hinweise

- Stellen Sie sicher, dass die Tianji-Serveradresse von Client-Browsern aus zugänglich ist
- Die Website-ID muss gültig sein, andernfalls können Daten nicht korrekt gesammelt werden
- Das Plugin hat nur Effekte, wenn der Antwortinhaltstyp HTML ist
- Es wird empfohlen, die neueste Version des Plugins für optimale Leistung und Funktionen zu verwenden

## Referenz

- [Quellcode des Plugins](https://github.com/msgbyte/traefik-tianji-plugin)
- [Traefik Plugin Dokumentation](https://doc.traefik.io/traefik/plugins/)
