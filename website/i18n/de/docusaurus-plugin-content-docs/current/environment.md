---
sidebar_position: 2
_i18n_hash: c65e22ae3d729a07b0b23f525a89b8ca
---
# Umgebung

Hier ist die Umgebung, die du in Docker konfigurieren kannst

| Name | Standardwert | Beschreibung |
| ---- | ---- | ----- |
| JWT_SECRET | - | Ein zufälliger String, der zur Berechnung des geheimen Schlüssels verwendet wird |
| ALLOW_REGISTER | false | Ob die Registrierung von Benutzerkonten erlaubt ist |
| ALLOW_OPENAPI | false | Ob die OpenAPI erlaubt ist, die Daten abrufen oder posten kann, ähnlich wie du mit der Benutzeroberfläche |
| SANDBOX_MEMORY_LIMIT | 16 | Benutzerdefinierte Skriptüberwachungssandbox-Speicherbegrenzung, die kontrolliert, dass Überwachungsskripte nicht zu viel Speicher verwenden (Einheit MB, der Mindestwert ist 8) |
| MAPBOX_TOKEN | - | MapBox-Token zur Verwendung von AMap, um die Standardbesucherkarte zu ersetzen |
| AMAP_TOKEN | - | AMap-Token zur Verwendung von AMap, um die Standardbesucherkarte zu ersetzen |
| CUSTOM_TRACKER_SCRIPT_NAME | - | Ändern des Standardnamens des `tracker.js`-Skripts für Adblock |
| DISABLE_ANONYMOUS_TELEMETRY | false | Deaktiviert das Senden von Telemetrieberichten an die offizielle Tianji-Website, wir werden die Nutzung mit einem Minimum an Anonymität an die offizielle Tianji-Website melden. |
| DISABLE_AUTO_CLEAR | false | Deaktiviert das automatische Löschen von Daten. |
