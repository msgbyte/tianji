---
sidebar_position: 2
_i18n_hash: ca2b25a29f0f1a82407be367a1d03553
---
# Parameter

Hier sind einige Beispiele, wie man das Telemetrie-Image verwenden und konfigurieren kann.

Alle Parameter sind optional und verbessern die Nutzung in verschiedenen Umgebungen.

| Name | Beschreibung |
| -------- | --------- |
| url | Standardmäßig wird die Referrer-URL verwendet, die automatisch vom Browser generiert wird. In einigen Websites ist es jedoch nicht erlaubt, diesen Header mitzuführen, daher musst du sie selbst bereitstellen. Wenn Tianji die URL nirgendwo erhalten kann, wird das System dies ignorieren und diesen Besuch nicht aufzeichnen. |
| name | Definiert den Namen des Telemetrie-Ereignisses, der verwendet werden kann, um verschiedene Ereignisse in derselben Telemetrie-Aufzeichnung zu unterscheiden. |
| title | **[Nur für Badges]**, Definiert den Badge-Titel |
| start | **[Nur für Badges]**, Definiert die Startanzahl für den Badge |
| fullNum | **[Nur für Badges]**, Definiert, ob die vollständige Zahl angezeigt wird, standardmäßig werden abgekürzte Ziffern verwendet (z.B. `12345` und `12.3k`) |

## Verwendung

Es ist einfach, Parameter in der URL mitzuführen.

Zum Beispiel:

```
https://tianji.example.com/telemetry/<workspaceId>/<telemetryId>/badge.svg?name=myEvent&url=https://google.com&title=My+Counter&start=100000&fullNum=true
```

Wenn du damit nicht vertraut bist, kannst du die Wiki-Seite dazu überprüfen: [https://en.wikipedia.org/wiki/Query_string](https://en.wikipedia.org/wiki/Query_string)
