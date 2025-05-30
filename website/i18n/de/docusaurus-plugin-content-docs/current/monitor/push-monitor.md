---
sidebar_position: 2
_i18n_hash: 0ab5a3f0d3e61495d00a9489e9a3f806
---
# Push-Monitor

Push-Monitor ist eine Überwachungsmethode, bei der Ihre Anwendung aktiv Herzschlagsignale an **Tianji** sendet, anstatt dass Tianji Ihren Dienst überprüft. Dies ist besonders nützlich zur Überwachung von Hintergrundaufgaben, Cron-Jobs oder Diensten hinter Firewalls, die nicht direkt zugänglich sind.

## Funktionsweise

1. **Tianji** stellt Ihnen eine einzigartige Push-Endpunkt-URL zur Verfügung.
2. Ihre Anwendung sendet in regelmäßigen Abständen HTTP-POST-Anfragen an diesen Endpunkt.
3. Wenn innerhalb der konfigurierten Timeout-Periode kein Herzschlag empfangen wird, löst Tianji einen Alarm aus.

## Konfiguration

Beim Erstellen eines Push-Monitors müssen Sie Folgendes konfigurieren:

- **Monitor-Name**: Ein beschreibender Name für Ihren Monitor
- **Timeout**: Die maximale Zeit (in Sekunden) zwischen den Herzschlägen, bevor der Service als ausgefallen betrachtet wird
- **Empfohlenes Intervall**: Wie oft Ihre Anwendung Herzschläge senden sollte (normalerweise gleich dem Timeout)

## Format des Push-Endpunkts

```
POST https://tianji.example.com/api/push/{pushToken}
```

### Statusparameter

- **Normaler Status**: Ohne Parameter oder mit `?status=up` senden
- **Ausfallstatus**: Mit `?status=down` senden, um manuell einen Alarm auszulösen
- **Benutzerdefinierte Nachricht**: Hinzufügen von `&msg=your-message`, um zusätzliche Informationen einzuschließen
- **Benutzerdefinierter Wert**: Hinzufügen von `&value=123`, um numerische Werte zu verfolgen

## Beispiele

### Grundlegender Herzschlag (cURL)

```bash
# Sende alle 60 Sekunden einen Herzschlag
while true; do
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>"
  sleep 60
done
```

### JavaScript/Node.js

```javascript
// Sende alle 60 Sekunden einen Herzschlag
setInterval(async () => {
  try {
    await fetch('https://tianji.example.com/api/push/<your-push-token>', { 
      method: 'POST' 
    });
    console.log('Heartbeat sent successfully');
  } catch (error) {
    console.error('Failed to send heartbeat:', error);
  }
}, 60000);
```

### Python

```python
import requests
import time

def send_heartbeat():
    try:
        response = requests.post('https://tianji.example.com/api/push/<your-push-token>')
        print('Heartbeat sent successfully')
    except Exception as e:
        print(f'Failed to send heartbeat: {e}')

# Sende alle 60 Sekunden einen Herzschlag
while True:
    send_heartbeat()
    time.sleep(60)
```

## Anwendungsfälle

### 1. Cron-Jobs

Die Ausführung von geplanten Aufgaben überwachen:

```bash
#!/bin/bash
# your-cron-job.sh

# Ihre tatsächliche Joblogik hier
./run-backup.sh

# Erfolgssignal senden
if [ $? -eq 0 ]; then
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>?status=up&msg=backup-completed"
else
  curl -X POST "https://tianji.example.com/api/push/<your-push-token>?status=down&msg=backup-failed"
fi
```

### 2. Hintergrunddienste

Lang laufende Hintergrundprozesse überwachen:

```python
import requests
import time
import threading

class ServiceMonitor:
    def __init__(self, push_url):
        self.push_url = push_url
        self.running = True
        
    def start_heartbeat(self):
        def heartbeat_loop():
            while self.running:
                try:
                    requests.post(self.push_url)
                    time.sleep(30)  # Alle 30 Sekunden senden
                except Exception as e:
                    print(f"Heartbeat failed: {e}")
        
        thread = threading.Thread(target=heartbeat_loop)
        thread.daemon = True
        thread.start()

# Nutzung
monitor = ServiceMonitor('https://tianji.example.com/api/push/<your-push-token>')
monitor.start_heartbeat()

# Ihre Hauptservice-Logik hier
while True:
    # Ihre Arbeit ausführen
    time.sleep(1)
```

### 3. Datenbanksynchronisations-Jobs

Datenabgleichsaufgaben überwachen:

```python
import requests
import schedule
import time

def sync_data():
    try:
        # Ihre Datensynchronisationslogik hier
        result = perform_data_sync()
        
        if result.success:
            requests.post(
                'https://tianji.example.com/api/push/<your-push-token>',
                params={'status': 'up', 'msg': f'synced-{result.records}-records'}
            )
        else:
            requests.post(
                'https://tianji.example.com/api/push/<your-push-token>',
                params={'status': 'down', 'msg': 'sync-failed'}
            )
    except Exception as e:
        requests.post(
            'https://tianji.example.com/api/push/<your-push-token>',
            params={'status': 'down', 'msg': f'error-{str(e)}'}
        )

# Einplanen, jede Stunde auszuführen
schedule.every().hour.do(sync_data)

while True:
    schedule.run_pending()
    time.sleep(1)
```

## Beste Praktiken

1. **Angemessene Timeouts einstellen**: Timeout-Werte basierend auf den Bedürfnissen Ihrer Anwendung konfigurieren. Für häufige Aufgaben kürzere Timeouts nutzen. Für periodische Jobs längere Timeouts verwenden.

2. **Netzwerkausfälle behandeln**: Implementieren Sie eine Wiederholungslogik in Ihrem Herzschlagcode, um temporäre Netzwerkprobleme zu bewältigen.

3. **Verwenden Sie aussagekräftige Nachrichten**: Fügen Sie beschreibende Nachrichten mit Ihren Herzschlägen hinzu, um beim Überprüfen der Protokolle Kontext zu bieten.

4. **Kritische Pfade überwachen**: Platzieren Sie Herzschlagaufrufe an kritischen Punkten im Anwendungsfluss, nicht nur am Anfang.

5. **Ausnahmebehandlung**: Senden Sie einen "down"-Status, wenn eine Ausnahme in Ihrer Anwendung auftritt.

## Fehlerbehebung

### Häufige Probleme

**Keine Herzschläge empfangen**:
- Überprüfen Sie, ob der Push-Token korrekt ist
- Netzwerkverbindung von Ihrer Anwendung zu Tianji überprüfen
- Sicherstellen, dass Ihre Anwendung tatsächlich den Herzschlagcode ausführt

**Häufige Fehlalarme**:
- Timeout-Wert erhöhen
- Überprüfen, ob Ihre Anwendung Leistungsprobleme hat
- Stabilität des Netzwerks zwischen Ihrer App und Tianji überprüfen

**Fehlende Herzschläge**:
- Fehlerbehandlung und Protokollierung zu Ihrem Herzschlagcode hinzufügen
- Überlegung, Wiederholungslogik für fehlgeschlagene Anfragen zu implementieren
- Überwachen Sie den Ressourcenverbrauch Ihrer Anwendung

## Sicherheitsaspekte

- Halten Sie Ihre Push-Tokens sicher und veröffentlichen Sie sie nicht in öffentlichen Repositories
- Verwenden Sie HTTPS-Endpunkte, um die Daten während der Übertragung zu verschlüsseln
- Erwägen Sie die regelmäßige Rotation von Push-Tokens
- Begrenzen Sie die Frequenz der Herzschläge, um Ihre Tianji-Instanz nicht zu überlasten

Push-Monitoring bietet eine zuverlässige Möglichkeit, Dienste zu überwachen, die durch klassisches Ping-basiertes Monitoring nicht erreichbar sind, und ist damit ein wesentliches Werkzeug für ein umfassendes Infrastrukturmonitoring.
