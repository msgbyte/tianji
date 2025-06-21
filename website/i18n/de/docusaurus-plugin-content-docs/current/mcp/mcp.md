---
sidebar_position: 1
_i18n_hash: bf0ff03e7619ebadc59e7451f16ddf69
---
# Integration mit MCP

<a href="https://cursor.com/install-mcp?name=tianji&config=eyJ0eXBlIjoic3RkaW8iLCJjb21tYW5kIjoibnB4IC15IHRpYW5qaS1tY3Atc2VydmVyIiwiZW52Ijp7IlRJQU5KSV9CQVNFX1VSTCI6IiIsIlRJQU5KSV9BUElfS0VZIjoiIiwiVElBTkpJX1dPUktTUEFDRV9JRCI6IiJ9fQ%3D%3D"><em><img src="https://cursor.com/deeplink/mcp-install-light.svg" alt="Tianji MCP-Server zu Cursor hinzufügen" height="32" /></em></a>

## Einführung

Der Tianji MCP Server ist ein auf dem Model Context Protocol (MCP) basierender Server, der als Brücke zwischen KI-Assistenten und der Tianji-Plattform dient. Er stellt die Umfragefunktionen der Tianji-Plattform über das MCP-Protokoll KI-Assistenten zur Verfügung. Dieser Server bietet die folgenden Kernfunktionen:

- Umfrageergebnisse abfragen
- Detaillierte Umfrageinformationen abrufen
- Alle Umfragen in einem Arbeitsbereich abrufen
- Webseitenliste abrufen

## Installationsmethoden

### NPX-Installation

Sie können den Tianji MCP Server verwenden, indem Sie die folgende Konfiguration zur Konfigurationsdatei Ihres KI-Assistenten hinzufügen:

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
        "TIANJI_API_KEY": "<Ihr-API-Schlüssel>",
        "TIANJI_WORKSPACE_ID": "<Ihre-Arbeitsbereich-ID>"
      }
    }
  }
}
```

### Konfiguration der Umgebungsvariablen

Bevor Sie den Tianji MCP Server verwenden, müssen Sie die folgenden Umgebungsvariablen festlegen:

```bash
# Tianji-Plattform API-Basis-URL
TIANJI_BASE_URL=https://tianji.example.com

# Tianji-Plattform API-Schlüssel
TIANJI_API_KEY=Ihr_API_Schlüssel_hier

# Tianji-Plattform Arbeitsbereichs-ID
TIANJI_WORKSPACE_ID=Ihre_Arbeitsbereich_ID_hier
```

### Einen API-Schlüssel erhalten

Sie können einen API-Schlüssel für die Tianji-Plattform erhalten, indem Sie die folgenden Schritte ausführen:

1. Melden Sie sich auf der Tianji-Plattform an und klicken Sie auf Ihr **Profilbild** in der oberen rechten Ecke
2. Wählen Sie **Profil** aus dem Dropdown-Menü
3. Auf der Profilseite finden Sie die Option **API-Schlüssel**
4. Klicken Sie auf "Neuen Schlüssel erstellen" und folgen Sie den Anweisungen, um die Schlüsselerstellung abzuschließen

## Gebrauchsanweisung

Der Tianji MCP Server bietet eine Reihe von Tools, die mit KI-Assistenten über das MCP-Protokoll interagieren können. Nachfolgend finden Sie die detaillierten Beschreibungen jedes Tools:

### Umfrageergebnisse abfragen

Verwenden Sie das Tool `tianji_get_survey_results`, um die Ergebnisdaten für eine bestimmte Umfrage abzufragen.

**Parameter:**

- `workspaceId`: Tianji-Arbeitsbereichs-ID (standardmäßig der in den Umgebungsvariablen konfigurierte Wert)
- `surveyId`: Umfrage-ID
- `limit`: Begrenzung der zurückgegebenen Datensätze (Standard 20)
- `cursor`: Paginierungscursor (optional)
- `startAt`: Startzeit, ISO-Format, Beispiel: 2023-10-01T00:00:00Z
- `endAt`: Endzeit, ISO-Format, Beispiel: 2023-10-31T23:59:59Z
- `filter`: Filterbedingungen (optional)

### Umfrageinformationen abrufen

Verwenden Sie das Tool `tianji_get_survey_info`, um grundlegende Informationen über eine bestimmte Umfrage zu erhalten.

**Parameter:**

- `workspaceId`: Tianji-Arbeitsbereichs-ID (standardmäßig der in den Umgebungsvariablen konfigurierte Wert)
- `surveyId`: Umfrage-ID

### Gesamte Umfrageliste abrufen

Verwenden Sie das Tool `tianji_get_all_survey_list`, um eine Liste aller Umfragen im Arbeitsbereich zu erhalten.

**Parameter:**

- `workspaceId`: Tianji-Arbeitsbereichs-ID (standardmäßig der in den Umgebungsvariablen konfigurierte Wert)

### Webseitenliste abrufen

Verwenden Sie das Tool `tianji_get_website_list`, um eine Liste der Webseiten im Arbeitsbereich zu erhalten.

**Parameter:**

- `workspaceId`: Tianji-Arbeitsbereichs-ID (standardmäßig der in den Umgebungsvariablen konfigurierte Wert)

## Anwendungsbeispiele

Nachfolgend finden Sie Beispiele für natürliche Sprachinteraktionen zwischen Benutzern und KI-Assistenten, die in den Tianji MCP Server integriert sind:

### Beispiel 1: Gesamte Umfrageliste abrufen

```
Benutzer: Hilf mir, alle meine Umfrage-Fragebogenlisten anzusehen

KI-Assistent: Ich werde alle Ihre Umfrage-Fragebogenlisten für Sie abrufen.
[KI-Assistent ruft tianji_get_all_survey_list über das MCP-Protokoll auf, um Daten abzurufen]
Basierend auf den Daten in Ihrem Arbeitsbereich haben Sie derzeit die folgenden Umfragen:
1. Umfrage zur Zufriedenheit mit der Benutzererfahrung (erstellt am 2023-09-15)
2. Produktmerkmale-Feedback-Umfrage (erstellt am 2023-10-01)
3. Bewertung der Benutzerfreundlichkeit der Webseite (erstellt am 2023-10-20)
```

### Beispiel 2: Details zu einer bestimmten Umfrage abrufen

```
Benutzer: Bitte teile mir die Details der "Umfrage zur Zufriedenheit mit der Benutzererfahrung" mit

KI-Assistent: Ich werde die Details dieser Umfrage für Sie abfragen.
[KI-Assistent ruft tianji_get_survey_info über das MCP-Protokoll auf, um Daten abzurufen]
Details zur "Umfrage zur Zufriedenheit mit der Benutzererfahrung":
- Erstellungszeit: 2023-09-15
- Status: Aktiv
- Anzahl der Fragen: 10
- Erholte Antworten: 128
- Letzte Antwort: 2023-10-25
```

### Beispiel 3: Umfrageergebnisse abfragen

```
Benutzer: Hilf mir, die Oktober-Ergebnisse der "Produktmerkmale-Feedback-Umfrage" zu analysieren

KI-Assistent: Ich werde die Oktober-Ergebnisse der "Produktmerkmale-Feedback-Umfrage" analysieren.
[KI-Assistent ruft tianji_get_survey_results über das MCP-Protokoll auf, um Daten für den spezifischen Zeitraum abzurufen]
Analyse der Oktober-Ergebnisse der "Produktmerkmale-Feedback-Umfrage":
- Gesamtantworten: 42
- Populärstes Merkmal: Automatisierte Berichte (85 % positives Feedback)
- Merkmal mit dem größten Verbesserungsbedarf: Mobile Anpassung (von 62 % erwähnt)
- Durchschnittliche Zufriedenheitsbewertung: 4,2/5
- Hauptbenutzerempfehlungen: Exportfunktionalität für Daten hinzufügen, Ladegeschwindigkeit der Seite optimieren
```
