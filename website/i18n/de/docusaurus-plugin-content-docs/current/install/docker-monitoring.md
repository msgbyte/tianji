---
sidebar_position: 20
_i18n_hash: e85199043ed7e89d1e71ea95a75b08df
---
# Docker-Container-Überwachungskonfiguration

## Standardüberwachungsverhalten

Wenn Sie Tianji mit Docker oder Docker Compose installieren, aktiviert das System automatisch die integrierte Serverüberwachung. Standardmäßig:

- **Überwacht Tianji automatisch die Nutzung der Systemressourcen seines eigenen Containers**
- Zu den Überwachungsdaten gehören: CPU-Auslastung, Speicherauslastung, Festplattenauslastung, Netzwerkverkehr usw.
- Diese Daten werden ohne zusätzliche Konfiguration automatisch an den Standardarbeitsbereich gemeldet
- Der Container erscheint im Überwachungs-Dashboard als `tianji-container`

## Überwachung aller Docker-Dienste auf dem Host-Maschine

Wenn Sie möchten, dass Tianji alle Docker-Container und -Dienste überwacht, die auf dem Host-Maschine laufen, nicht nur sich selbst, müssen Sie den Docker-Socket in den Container einbinden.

### Konfigurationsmethode

Fügen Sie folgende Volumes-Konfiguration zum `tianji`-Dienstabschnitt in Ihrer `docker-compose.yml` Datei hinzu:

```yaml
services:
  tianji:
    image: moonrailgun/tianji
    # ... andere Konfigurationen ...
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    # ... andere Konfigurationen ...
```

### Vollständiges Beispiel für docker-compose.yml

```yaml
version: '3'
services:
  tianji:
    image: moonrailgun/tianji
    build:
      context: ./
      dockerfile: ./Dockerfile
    ports:
      - "12345:12345"
    environment:
      DATABASE_URL: postgresql://tianji:tianji@postgres:5432/tianji
      JWT_SECRET: replace-me-with-a-random-string
      ALLOW_REGISTER: "false"
      ALLOW_OPENAPI: "true"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # Diese Zeile hinzufügen
    depends_on:
      - postgres
    restart: always
  postgres:
    # ... postgres Konfiguration ...
```

### Verwendung des Docker-Run-Befehls

Wenn Sie Tianji mit dem `docker run` Befehl starten, können Sie folgenden Parameter hinzufügen:

```bash
docker run -d \
  --name tianji \
  -p 12345:12345 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  moonrailgun/tianji
```

## Auswirkungen nach der Konfiguration

Nach dem Hinzufügen der Docker-Socket-Einstellung kann Tianji:

- Alle auf dem Host-Maschine laufenden Docker-Container überwachen
- Ressourcenverbrauchsinformationen der Container abrufen
- Statusinformationen der Container anzeigen
- Eine umfassendere Systemüberwachungsansicht bereitstellen
