---
sidebar_position: 2
_i18n_hash: 7ce5eca3bf7af802db48c3db37d996f5
---
# Server-Statusseite

Sie können eine Server-Statusseite für Benutzer erstellen, um den Status Ihres Servers der Öffentlichkeit anzuzeigen, die es anderen zeigen möchte.

## Konfigurieren einer benutzerdefinierten Domain

Sie können Ihre Statusseite in Ihrer eigenen Domain konfigurieren, zum Beispiel: `status.example.com`

Legen Sie dies in der Seitenkonfiguration fest und erstellen Sie einen `CNAME`-Eintrag in Ihrem DNS-Dashboard.

```
CNAME status.example.com tianji.example.com
```

Danach können Sie die benutzerdefinierte Domain `status.example.com` besuchen, um auf Ihre Seite zuzugreifen.
