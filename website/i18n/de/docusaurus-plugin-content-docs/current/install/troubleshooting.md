---
sidebar_position: 100
_i18n_hash: 05e241c8bd878bb8fb511bdc81a2cee9
---
# Fehlerbehebung

Dieses Dokument sammelt häufige Probleme und deren Lösungen, die bei der Verwendung von Tianji auftreten können.

## WebSocket-Verbindungsprobleme

### Problembeschreibung

Beim Verwenden von HTTPS-Diensten funktionieren andere Funktionen normal, aber der WebSocket-Dienst kann nicht ordnungsgemäß verbunden werden, was sich wie folgt äußert:

- Der Verbindungsstatusanzeiger in der unteren linken Ecke zeigt grau
- Die Serverseitenseitenliste zeigt Zählungen, aber keinen tatsächlichen Inhalt

### Ursache

Dieses Problem wird normalerweise durch falsche Weiterleitungsrichtlinien für WebSockets in Revers-Proxy-Software verursacht. In HTTPS-Umgebungen erfordern WebSocket-Verbindungen korrekte Cookie-Sicherheitsrichtlinien.

### Lösung

Sie können dieses Problem beheben, indem Sie die folgende Umgebungsvariable setzen:

```bash
AUTH_USE_SECURE_COOKIES=true
```

Diese Einstellung zwingt die Anwendung, Cookies, die vom Browser übergeben werden, als verschlüsselte Cookies zu behandeln, wodurch das Problem mit den WebSocket-Verbindungen behoben wird.

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

**systemd-Dienst:**
```ini
[Service]
Environment=AUTH_USE_SECURE_COOKIES=true
```

### Überprüfungsschritte

Nach der Konfiguration starten Sie den Dienst neu und überprüfen Sie:

1. Der Verbindungsstatusanzeiger unten links sollte grün anzeigen
2. Serverseiten sollten Echtzeitdaten normal anzeigen
3. WebSocket-Verbindungen sollten ordnungsgemäß in den Entwickler-Tools des Browsers hergestellt werden

---

*Wenn Sie auf andere Probleme stoßen, können Sie gerne ein [Issue](https://github.com/msgbyte/tianji/issues) einreichen oder Lösungen zu dieser Dokumentation beitragen.*
