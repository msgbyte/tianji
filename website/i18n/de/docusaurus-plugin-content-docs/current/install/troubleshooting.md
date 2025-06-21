---
sidebar_position: 100
_i18n_hash: 2419750faca3b35056a24bc0a5e02a22
---
# Fehlerbehebung

Dieses Dokument sammelt häufige Probleme und deren Lösungen, die bei der Verwendung von Tianji auftreten können.

## WebSocket-Verbindungsprobleme

### Problembeschreibung

Bei der Nutzung von HTTPS-Diensten funktionieren andere Funktionen normal, aber der WebSocket-Dienst kann nicht ordnungsgemäß verbunden werden, was sich wie folgt zeigt:

- Der Verbindungsstatusanzeiger in der unteren linken Ecke zeigt grau an
- Die Serverseitenseitenliste zeigt Zählungen, aber keinen tatsächlichen Inhalt

### Ursachenermittlung

Dieses Problem wird meist durch unzureichende WebSocket-Weiterleitungsrichtlinien in der Reverse-Proxy-Software verursacht. In HTTPS-Umgebungen erfordern WebSocket-Verbindungen korrekte Cookie-Sicherheitsrichtlinien.

### Lösung

Sie können dieses Problem durch Setzen der folgenden Umgebungsvariable lösen:

```bash
AUTH_USE_SECURE_COOKIES=true
```

Diese Einstellung zwingt die Anwendung, Cookies, die vom Browser übermittelt werden, als verschlüsselte Cookies zu behandeln und löst somit die Probleme mit WebSocket-Verbindungen.

#### Konfigurationsmethoden

**Docker-Umgebung:**
```yaml
# docker-compose.yml
services:
  tianji:
    environment:
      - AUTH_USE_SECURE_COOKIES=true
```

**Direkte Bereitstellung:**
```bash
export AUTH_USE_SECURE_COOKIES=true
```

### Überprüfungsschritte

Nach der Konfiguration starten Sie den Dienst neu und überprüfen Sie:

1. Der Verbindungsstatusanzeiger unten links sollte grün anzeigen
2. Serverseiten sollten Echtzeitdaten normal anzeigen
3. WebSocket-Verbindungen sollten ordnungsgemäß in den Entwickler-Tools des Browsers hergestellt werden

---

*Wenn Sie auf andere Probleme stoßen, können Sie gerne ein [Issue](https://github.com/msgbyte/tianji/issues) einreichen oder Lösungen zu dieser Dokumentation beitragen.*
