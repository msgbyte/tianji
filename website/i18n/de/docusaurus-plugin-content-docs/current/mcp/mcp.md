---
sidebar_position: 1
_i18n_hash: 50d592e977b3f195d40bd2931b68269b
---
# Integration mit MCP

<a href="https://cursor.com/install-mcp?name=tianji&config=eyJ0eXBlIjoic3RkaW8iLCJjb21tYW5kIjoibnB4IC15IHRpYW5qaS1tY3Atc2VydmVyIiwiZW52Ijp7IlRJQU5KSV9CQVNFX1VSTCI6IiIsIlRJQU5KSV9BUElfS0VZIjoiIiwiVElBTkpJX1dPUktTUEFDRV9JRCI6IiJ9fQ%3D%3D"><em><img src="https://cursor.com/deeplink/mcp-install-light.svg" alt="Füge Tianji MCP-Server zu Cursor hinzu" height="32" /></em></a>
<br />
[![Zu Kiro hinzufügen](https://kiro.dev/images/add-to-kiro.svg)](https://kiro.dev/launch/mcp/add?name=tianji&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22tianji-mcp-server%22%5D%2C%22env%22%3A%7B%22TIANJI_BASE_URL%22%3A%22https%3A%2F%2Ftianji.example.com%22%2C%22TIANJI_API_KEY%22%3A%22%3Cyour-api-key%3E%22%2C%22TIANJI_WORKSPACE_ID%22%3A%22%3Cyour-workspace-id%3E%22%7D%7D)

## Einführung

Der Tianji MCP-Server ist ein auf dem Model Context Protocol (MCP) basierender Server, der als Brücke zwischen KI-Assistenten und der Tianji-Plattform dient. Er stellt die Umfragefunktionalität der Tianji-Plattform KI-Assistenten über das MCP-Protokoll zur Verfügung. Dieser Server bietet folgende Kernfunktionen:

- Abfrage von Umfrageergebnissen
- Abrufen detaillierter Umfrageinformationen
- Abrufen aller Umfragen in einem Arbeitsbereich
- Abrufen der Website-Liste

## Installationsmethoden

### NPX-Installation

Sie können den Tianji MCP-Server verwenden, indem Sie die folgende Konfiguration zur Konfigurationsdatei Ihres KI-Assistenten hinzufügen:

```json
{
  "mcpServers": {
    "tianji": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "tianji-mcp-server"
      ],
      "env": {
        "TIANJI_BASE_URL": "https://tianji.example.com",
        "TIANJI_API_KEY": "<your-api-key>",
        "TIANJI_WORKSPACE_ID": "<your-workspace-id>"
      }
    }
  }
}
```

### Konfiguration der Umgebungsvariablen

Bevor Sie den Tianji MCP-Server verwenden, müssen Sie die folgenden Umgebungsvariablen festlegen:

```bash
# API-Basis-URL der Tianji-Plattform
TIANJI_BASE_URL=https://tianji.example.com

# API-Schlüssel der Tianji-Plattform
TIANJI_API_KEY=your_api_key_here

# Arbeitsbereichs-ID der Tianji-Plattform
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### Erlangen eines API-Schlüssels

Sie können einen API-Schlüssel für die Tianji-Plattform erhalten, indem Sie die folgenden Schritte befolgen:

1. Melden Sie sich bei der Tianji-Plattform an und klicken Sie auf Ihr **Profilbild** in der rechten oberen Ecke
2. Wählen Sie **Profil** aus dem Dropdown-Menü
3. Auf der Profilseite finden Sie die Option **API-Schlüssel**
4. Klicken Sie auf "Neuen Schlüssel erstellen" und folgen Sie den Anweisungen, um die Schlüsselherstellung abzuschließen

## Gebrauchsanweisungen

Der Tianji MCP-Server bietet eine Reihe von Tools, die über das MCP-Protokoll mit KI-Assistenten interagieren können. Nachfolgend finden Sie detaillierte Beschreibungen zu jedem Tool:

### Abfrage von Umfrageergebnissen

Nutzen Sie das Tool `tianji_get_survey_results`, um Ergebnisdaten für eine bestimmte Umfrage abzufragen.

**Parameter:**

- `workspaceId`: Tianji-Arbeitsbereichs-ID (Standard ist die in den Umgebungsvariablen konfigurierte Wert)
- `surveyId`: Umfrage-ID
- `limit`: Begrenzung der Anzahl der zurückgegebenen Datensätze (Standard 20)
- `cursor`: Paginierungscursor (optional)
- `startAt`: Startzeit im ISO-Format, Beispiel: 2023-10-01T00:00:00Z
- `endAt`: Endzeit im ISO-Format, Beispiel: 2023-10-31T23:59:59Z
- `filter`: Filterbedingungen (optional)

### Abrufen von Umfrageinformationen

Verwenden Sie das Tool `tianji_get_survey_info`, um grundlegende Informationen zu einer bestimmten Umfrage zu erhalten.

**Parameter:**

- `workspaceId`: Tianji-Arbeitsbereichs-ID (Standard ist die in den Umgebungsvariablen konfigurierte Wert)
- `surveyId`: Umfrage-ID

### Alle Umfragelisten abrufen

Verwenden Sie das Tool `tianji_get_all_survey_list`, um eine Liste aller Umfragen im Arbeitsbereich zu erhalten.

**Parameter:**

- `workspaceId`: Tianji-Arbeitsbereichs-ID (Standard ist die in den Umgebungsvariablen konfigurierte Wert)

### Abrufen der Website-Liste

Verwenden Sie das Tool `tianji_get_website_list`, um eine Liste der Websites im Arbeitsbereich zu erhalten.

**Parameter:**

- `workspaceId`: Tianji-Arbeitsbereichs-ID (Standard ist die in den Umgebungsvariablen konfigurierte Wert)

## Anwendungsbeispiele

Nachfolgend finden Sie Beispiele für natürliche Sprachinteraktionen zwischen Benutzern und KI-Assistenten, die in den Tianji MCP-Server integriert sind:

### Beispiel 1: Alle Umfragelisten abrufen

```
Benutzer: Helfen Sie mir, alle meine Umfrage-Fragebogenlisten anzusehen

KI-Assistent: Ich werde alle Ihre Umfrage-Fragebogenlisten für Sie abrufen.
[KI-Assistent ruft `tianji_get_all_survey_list` über das MCP-Protokoll auf, um Daten zu erhalten]
Basierend auf den Daten in Ihrem Arbeitsbereich haben Sie derzeit die folgenden Umfragen:
1. Umfrage zur Nutzerzufriedenheit (erstellt am 15.09.2023)
2. Feedback-Umfrage zu Produktfunktionen (erstellt am 01.10.2023)
3. Bewertung der Benutzerfreundlichkeit der Website (erstellt am 20.10.2023)
```

### Beispiel 2: Abrufen von Details einer bestimmten Umfrage

```
Benutzer: Bitte teile mir die Details der "Umfrage zur Nutzerzufriedenheit" mit

KI-Assistent: Ich werde die Details dieser Umfrage für Sie abfragen.
[KI-Assistent ruft `tianji_get_survey_info` über das MCP-Protokoll auf, um Daten zu erhalten]
Details der "Umfrage zur Nutzerzufriedenheit":
- Erstellungszeit: 15.09.2023
- Status: Aktiv
- Anzahl der Fragen: 10
- Gesammelte Antworten: 128
- Neueste Antwort: 25.10.2023
```

### Beispiel 3: Abfrage von Umfrageergebnissen

```
Benutzer: Hilf mir, die Oktober-Ergebnisse der "Feedback-Umfrage zu Produktfunktionen" zu analysieren

KI-Assistent: Ich werde die Oktober-Ergebnisse der "Feedback-Umfrage zu Produktfunktionen" analysieren.
[KI-Assistent ruft `tianji_get_survey_results` über das MCP-Protokoll auf, um Daten für den spezifischen Zeitraum zu erhalten]
Analyse der Ergebnisse der "Feedback-Umfrage zu Produktfunktionen" vom Oktober:
- Gesamte Antworten: 42
- Beliebteste Funktion: Automatisierte Berichte (85% positive Rückmeldungen)
- Am stärksten verbesserungswürdige Funktion: Mobile Anpassung (von 62% erwähnt)
- Durchschnittliche Zufriedenheitsbewertung: 4,2/5
- Hauptnutzer-Vorschläge: Datenexport-Funktion hinzufügen, Optimierung der Seitenladegeschwindigkeit
```
