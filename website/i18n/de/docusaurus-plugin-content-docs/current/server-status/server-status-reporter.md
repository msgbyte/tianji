---
sidebar_position: 1
_i18n_hash: 848acc7fae249b1c435a363e4693a5c7
---
# Server Status Reporter

Sie können den Status Ihres Servers einfach mit dem Tianji Reporter melden.

Sie können es von [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases) herunterladen.

## Verwendung

```
Verwendung von tianji-reporter:
  --interval int
        Geben Sie das INTERVAL in Sekunden ein (Standard: 5)
  --mode http
        Der Sendemodus der Berichtsdaten, Sie können wählen: `http` oder `udp`, Standard ist `http` (Standard: "http")
  --name string
        Der Identifikationsname für diesen Rechner
  --url string
        Die HTTP-URL von Tianji, z.B.: https://tianji.msgbyte.com
  --vnstat
        Verwenden Sie vnstat für die Datenverkehrsstatistik, nur Linux
  --workspace string
        Die Arbeitsbereichs-ID für Tianji, dies sollte eine UUID sein
```

**url** und **workspace** sind erforderlich, sie bedeuten, zu welchem Host und welchem Arbeitsbereich Sie Ihren Dienst melden werden.

Standardmäßig wird der Name eines Serverknotens mit dem Hostnamen identisch sein, sodass Sie Ihren Namen mit `--name` anpassen können, um den Server zu identifizieren.

## Automatisiertes Installationsskript

Sie können Ihr automatisiertes Installationsskript in `Tianji` -> `Server` -> `Hinzufügen` -> `Automatisch` Tab erhalten.

Es wird automatisch den Reporter herunterladen und einen Linux-Dienst auf Ihrem Rechner erstellen. Daher sind Root-Berechtigungen erforderlich.

### Deinstallation

Wenn Sie den Reporter-Dienst deinstallieren möchten, können Sie diesen Befehl verwenden:
```bash
curl -o- https://tianji.exmaple.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | bash -s uninstall
```

Der Hauptunterschied besteht darin, `-s uninstall` nach Ihrem Installationsbefehl anzuhängen.

## Q&A

### Wie überprüfe ich die Protokolle des Tianji Reporter-Dienstes?

Wenn Sie mit dem automatisierten Installationsskript installiert haben, wird Tianji Ihnen einen Dienst namens `tianji-reporter` auf Ihrem Linux-Rechner installieren.

Sie können diesen Befehl verwenden, um die Protokolle des Tianji Reporter zu überprüfen:

```bash
journalctl -fu tianji-reporter.service
```

### Mein Rechner wird im Server-Tab nicht gefunden, obwohl der Bericht erfolgreich war

Vielleicht befindet sich Ihr Tianji hinter einem Reverse-Proxy, z.B. `nginx`.

Stellen Sie sicher, dass Ihr Reverse-Proxy WebSocket-Unterstützung hinzufügt.

## Warum ist mein Rechner immer offline?

Bitte überprüfen Sie die Serverzeit.
