---
sidebar_position: 1
_i18n_hash: 479219b036abf3d6006999bf96fd2ea9
---
# Serverstatus-Berichterstatter

Sie können den Status Ihres Servers einfach mit dem Tianji-Berichterstatter melden.

Sie können es herunterladen von [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases)

## Nutzung

```
Verwendung von tianji-reporter:
  --interval int
        Eingabe des INTERVALLS, Sekunden (Standard 5)
  --mode http
        Der Sendemodus der Berichtsdaten, Sie können wählen: `http` oder `udp`, Standard ist `http` (Standard "http")
  --name string
        Der Identifikationsname für diese Maschine
  --url string
        Die HTTP-URL von Tianji, zum Beispiel: https://tianji.dev
  --vnstat
        Verwenden Sie vnstat für die Verkehrsdaten, nur Linux
  --workspace string
        Die Arbeitsbereich-ID für Tianji, dies sollte eine UUID sein
```

Die **URL** und **Arbeitsbereich** sind erforderlich, das bedeutet, dass Sie Ihren Dienst an welchen Host und welchen Arbeitsbereich melden werden.

Standardmäßig wird ein Serverknotenname derselbe wie der Hostname sein. Sie können jedoch Ihren Namen mit `--name` anpassen, was Ihnen hilft, den Server zu identifizieren.

## Automatisches Installations-Skript

Sie können Ihr automatisches Installations-Skript in `Tianji` -> `Server` -> `Hinzufügen` -> `Auto`-Tab erhalten.

Es wird automatisch den Berichterstatter herunterladen und einen Linux-Dienst auf Ihrer Maschine erstellen. Daher sind Root-Berechtigungen erforderlich.

### Deinstallation

Wenn Sie den Berichterstattungsdienst deinstallieren möchten, können Sie diesen Befehl verwenden wie:

```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
```

Die Hauptänderung besteht darin, `-s uninstall` an Ihren Installationsbefehl anzuhängen.

## Kubernetes

Wenn Ihre Server in einem Kubernetes-Cluster laufen, können Sie den Berichterstatter als DaemonSet bereitstellen, sodass jeder Knoten automatisch Metriken berichtet. Siehe [Berichterstatter als DaemonSet bereitstellen](./kubernetes/reporter-daemonset.md) für Details.

## Fragen & Antworten

### Wie überprüfe ich das Tianji-Berichterstattungsdienstprotokoll?

Wenn Sie mit dem automatischen Installationsskript installieren, hilft Ihnen Tianji, einen Dienst namens `tianji-reporter` auf Ihrer Linux-Maschine zu installieren.

Sie können diesen Befehl verwenden, um das Tianji-Berichterstatterprotokoll zu überprüfen:

```bash
journalctl -fu tianji-reporter.service
```

### Ihre Maschine wird nicht im Server-Tab gefunden, obwohl die Meldung erfolgreich angezeigt wird

Vielleicht befindet sich Ihr Tianji hinter einem Reverse-Proxy wie `nginx`.

Bitte stellen Sie sicher, dass Ihr Reverse-Proxy WebSocket-Unterstützung hinzufügt.

## Warum ist meine Maschine immer offline?

Bitte überprüfen Sie das Datum und die Uhrzeit Ihres Servers.
