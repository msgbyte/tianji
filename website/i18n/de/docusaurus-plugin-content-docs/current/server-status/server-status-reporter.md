---
sidebar_position: 1
_i18n_hash: d9dd1597f6c275ebc68c7421c31b29fe
---
# Serverstatus Reporter

Sie können den Status Ihres Servers ganz einfach mit dem Tianji Reporter melden.

Sie können es von [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases) herunterladen.

## Verwendung

```
Verwendung von tianji-reporter:
  --interval int
        Geben Sie das INTERVALL ein, in Sekunden (Standard 5)
  --mode http
        Der Sendemodus der Berichtsdaten, Sie können wählen: `http` oder `udp`, Standard ist `http` (Standard "http")
  --name string
        Der Identifikationsname für diese Maschine
  --url string
        Die HTTP-URL von Tianji, zum Beispiel: https://tianji.msgbyte.com
  --vnstat
        Verwenden Sie vnstat für Verkehrsstatistiken, nur Linux
  --workspace string
        Die Arbeitsbereich-ID für Tianji, dies sollte eine UUID sein
```

Die **URL** und der **Arbeitsbereich** sind erforderlich, das bedeutet, Sie werden Ihren Dienst zu welchem Host und Arbeitsbereich melden.

Standardmäßig ist der Serverknotenname derselbe wie der Hostname; daher können Sie mit `--name` einen benutzerdefinierten Namen festlegen, der Ihnen hilft, den Server zu identifizieren.

## Automatisches Installationsskript

Sie können Ihr automatisches Installationsskript erhalten in `Tianji` -> `Server` -> `Hinzufügen` -> Registerkarte `Auto`.

Es wird automatisch den Reporter herunterladen und einen Linux-Dienst auf Ihrer Maschine erstellen, daher sind Root-Berechtigungen erforderlich.

### Deinstallation

Wenn Sie den Reports-Dienst deinstallieren möchten, können Sie diesen Befehl verwenden:

```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
``` 

Die Hauptänderung besteht darin, `-s uninstall` an Ihren Installationsbefehl anzuhängen.

## F&A

### Wie überprüfe ich das Tianji Reporter Dienstprotokoll?

Wenn Sie mit dem automatischen Installationsskript installieren, wird Tianji Ihnen helfen, einen Dienst mit dem Namen `tianji-reporter` auf Ihrer Linux-Maschine zu installieren.

Sie können diesen Befehl verwenden, um das Tianji Reporter Protokoll zu überprüfen:

```bash
journalctl -fu tianji-reporter.service
```

### Ihre Maschine wird nicht im Server-Tab gefunden, obwohl der Bericht Erfolg zeigt

Vielleicht befindet sich Ihr Tianji hinter einem Reverse-Proxy, zum Beispiel `nginx`.

Bitte stellen Sie sicher, dass Ihr Reverse-Proxy Websocket-Unterstützung hinzufügt.

## Warum ist meine Maschine immer offline?

Bitte überprüfen Sie das Datum und die Uhrzeit Ihres Servers.
