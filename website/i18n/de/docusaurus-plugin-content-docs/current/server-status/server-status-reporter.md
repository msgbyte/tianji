---
sidebar_position: 1
_i18n_hash: 1de8a86599061f446dd0699137a4e68c
---
# Server Status Reporter

Sie können den Status Ihres Servers ganz einfach mit dem Tianji-Reporter melden.

Sie können es von [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases) herunterladen.

## Verwendung

```
Verwendung des tianji-reporters:
  --interval int
        Geben Sie das INTERVAL an, in Sekunden (standardmäßig 5)
  --mode http
        Der Sendemodus der Berichtsdaten, Sie können auswählen: `http` oder `udp`, standardmäßig ist `http` (standardmäßig "http")
  --name string
        Der Identifikationsname für diese Maschine
  --url string
        Die HTTP-URL von Tianji, zum Beispiel: https://tianji.msgbyte.com
  --vnstat
        Verwenden Sie vnstat zur Verkehrstatistik, nur Linux
  --workspace string
        Die Workspace-ID für Tianji, dies sollte eine UUID sein
```

Die **url** und **workspace** sind erforderlich, das bedeutet, dass Sie melden, an welchen Host und in welches Workspace Sie Ihren Dienst berichten.

Standardmäßig ist der Name eines Serverknotens derselbe wie der Hostname, Sie können jedoch Ihren Namen mit `--name` anpassen, was Ihnen hilft, den Server zu identifizieren.

## Automatisches Installationsskript

Sie können Ihr automatisches Installationsskript in `Tianji` -> `Server` -> `Hinzufügen` -> `Auto`-Registerkarte erhalten.

Es wird automatisch den Reporter herunterladen und einen Linux-Dienst auf Ihrer Maschine erstellen. Daher sind Root-Berechtigungen erforderlich.

### Deinstallation

Wenn Sie den Reporter-Dienst deinstallieren möchten, können Sie diesen Befehl verwenden:
```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
``` 

Die wesentliche Änderung besteht darin, `-s uninstall` nach Ihrem Installationsbefehl hinzuzufügen.

## Fragen & Antworten

### Wie kann ich das Protokoll des Tianji-Reporters überprüfen?

Wenn Sie mit dem automatischen Installationsskript installiert haben, hilft Ihnen Tianji, einen Dienst namens `tianji-reporter` auf Ihrem Linux-Computer zu installieren.

Sie können diesen Befehl verwenden, um das Protokoll des Tianji-Reporters zu überprüfen:

```bash
journalctl -fu tianji-reporter.service
```

### Nicht gefunden Ihre Maschine in der Server-Registerkarte, obwohl der Bericht erfolgreich angezeigt wird

Vielleicht befindet sich Ihr Tianji hinter einem Reverse-Proxy wie `nginx`.

Bitte stellen Sie sicher, dass Ihr Reverse-Proxy WebSocket-Unterstützung hinzufügt.

## Warum ist meine Maschine immer offline?

Bitte überprüfen Sie das Datum und die Uhrzeit Ihres Servers.
