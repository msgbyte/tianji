---
sidebar_position: 1
_i18n_hash: 21a5dc8265605536c8c328c551abdcc9
---
# Server-Status-Reporter

Sie können den Status Ihres Servers ganz einfach mit dem Tianji-Reporter melden.

Sie können ihn herunterladen von: [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases)

## Verwendung

```
Verwendung von tianji-reporter:
  --interval int
        Intervall in Sekunden eingeben (Standard 5)
  --mode http
        Der Sendemodus der Berichtsdaten, Sie können wählen: `http` oder `udp`, Standard ist `http` (Standard "http")
  --name string
        Der Identifikationsname für diese Maschine
  --url string
        Die HTTP-URL von Tianji, zum Beispiel: https://tianji.msgbyte.com
  --vnstat
        Verwenden Sie vnstat für Verkehrsstatistiken, nur für Linux
  --workspace string
        Die Workspace-ID für Tianji, dies sollte eine UUID sein
```

Die **URL** und **Workspace** sind erforderlich, das bedeutet, dass Sie angeben, zu welchem Host und welchem Workspace Sie Ihre Dienste berichten.

Standardmäßig ist der Name eines Serverknotens identisch mit dem Hostnamen, Sie können jedoch Ihren Namen mit `--name` anpassen, was Ihnen hilft, den Server zu identifizieren.

## Auto-Installationsskript

Sie können Ihr Auto-Installationsskript unter `Tianji` -> `Servers` -> `Add` -> `Auto` Tab erhalten.

Es lädt automatisch den Reporter herunter und erstellt einen Linux-Dienst auf Ihrer Maschine, hierfür sind Root-Rechte erforderlich.

### Deinstallation

Wenn Sie den Reporterdienst deinstallieren möchten, können Sie diesen Befehl verwenden:
```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
```

Die Hauptänderung besteht darin, `-s uninstall` zu Ihrem Installationsbefehl hinzuzufügen.

## Kubernetes

Wenn Ihre Server in einem Kubernetes-Cluster laufen, können Sie den Reporter als DaemonSet bereitstellen, sodass jeder Knoten die Metriken automatisch meldet. Siehe [Reporter als DaemonSet bereitstellen](./kubernetes/reporter-daemonset.md) für Details.

## Q&A

### Wie überprüfe ich das Tianji-Reporter-Service-Log?

Wenn Sie mit dem Auto-Installationsskript installieren, hilft Ihnen Tianji dabei, einen Dienst zu installieren, der auf Ihrer Linux-Maschine `tianji-reporter` heißt.

Sie können diesen Befehl verwenden, um das Tianji-Reporter-Log zu überprüfen:

```bash
journalctl -fu tianji-reporter.service
```

### Warum ist meine Maschine nicht im Server-Tab, obwohl der Bericht als erfolgreich angezeigt wird?

Vielleicht befindet sich Ihr Tianji hinter einem Reverse-Proxy, zum Beispiel `nginx`.

Bitte stellen Sie sicher, dass Ihr Reverse-Proxy WebSocket-Unterstützung hinzufügt.

## Warum ist meine Maschine immer offline?

Bitte überprüfen Sie die Datum-Uhrzeit Ihres Servers.
