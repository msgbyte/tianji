---
sidebar_position: 2
_i18n_hash: cecc3b1b7eb92c03797671e2ab259486
---
# Server-Statusseite

Sie können eine Server-Statusseite erstellen, um den Benutzern den Status Ihres Servers öffentlich anzuzeigen und anderen mitzuteilen.

## Benutzerdefinierte Domain konfigurieren

Sie können Ihre Statusseite in Ihrer eigenen Domain konfigurieren, zum Beispiel: `status.example.com`

Konfigurieren Sie dies in den Seiteneinstellungen und erstellen Sie einen `CNAME`-Eintrag in Ihrem DNS-Dashboard.

```
CNAME status.example.com tianji.example.com
```

Dann können Sie die benutzerdefinierte `status.example.com`-Seite besuchen.

### Fehlerbehebung

Falls ein 500-Fehler auftritt, scheint Ihr Reverse Proxy nicht korrekt konfiguriert zu sein.

Bitte stellen Sie sicher, dass Ihr Reverse Proxy Ihre neue Statusroute enthält.

Beispiel:
```
server {
  listen 80;
  server_name tianji.example.com status.example.com;
  listen 443 ssl;
}
```
