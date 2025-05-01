---
sidebar_position: 1
_i18n_hash: 3259721dc0b4a861181514a7b0e0add4
---
# Integration mit MCP

## Einführung

Der Tianji MCP Server ist ein Server basierend auf dem Model Context Protocol (MCP), der als Brücke zwischen KI-Assistenten und der Tianji-Plattform dient. Er bietet die Umfragefunktionen der Tianji-Plattform über das MCP-Protokoll für KI-Assistenten an. Dieser Server bietet folgende Kernfunktionen:

- Abfrage von Umfrageergebnissen
- Abruf detaillierter Umfrageinformationen
- Erhalt aller Umfragen in einem Arbeitsbereich
- Erhalt der Webseitenliste

## Installationsmethoden

### Installation über NPX

Sie können den Tianji MCP Server verwenden, indem Sie folgende Konfiguration zur Konfigurationsdatei Ihres KI-Assistenten hinzufügen:

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
        "TIANJI_WORKSPACE_ID": "<Ihre-Workspace-ID>"
      }
    }
  }
}
```

### Konfiguration von Umgebungsvariablen

Vor der Verwendung des Tianji MCP Servers müssen Sie folgende Umgebungsvariablen setzen:

```bash
# Basis-URL der Tianji Plattform API
TIANJI_BASE_URL=https://tianji.example.com

# API-Schlüssel der Tianji Plattform
TIANJI_API_KEY=Ihr_api_schlüssel_hier

# Workspace-ID der Tianji Plattform
TIANJI_WORKSPACE_ID=Ihre_workspace_id_hier
```

### Erhalten eines API-Schlüssels

Sie können einen API-Schlüssel der Tianji Plattform durch folgende Schritte erhalten:

1. Melden Sie sich bei der Tianji-Plattform an und klicken Sie auf Ihr **Profilbild** in der oberen rechten Ecke.
2. Wählen Sie **Profil** aus dem Dropdown-Menü.
3. Auf der Profilseite finden Sie die Option **API-Schlüssel**.
4. Klicken Sie auf neuen Schlüssel erstellen und folgen Sie den Anweisungen, um die Erstellung des Schlüssels abzuschließen.

## Benutzungsanleitung

Der Tianji MCP Server bietet eine Reihe von Tools, die über das MCP-Protokoll mit KI-Assistenten interagieren können. Nachfolgend finden Sie detaillierte Beschreibungen zu jedem Tool:

### Umfrageergebnisse abfragen

Verwenden Sie das Tool `tianji_get_survey_results`, um Ergebnisdaten für eine bestimmte Umfrage abzufragen.

**Parameter:**

- `workspaceId`: Tianji Workspace-ID (Standardwert ist der Wert, der in den Umgebungsvariablen konfiguriert ist)
- `surveyId`: Umfrage-ID
- `limit`: Begrenzung der zurückgegebenen Aufzeichnungen (Standardwert 20)
- `cursor`: Paginierungs-Cursor (optional)
- `startAt`: Startzeit, ISO-Format, Beispiel: 2023-10-01T00:00:00Z
- `endAt`: Endzeit, ISO-Format, Beispiel: 2023-10-31T23:59:59Z
- `filter`: Filterbedingungen (optional)

### Umfrageinformationen abrufen

Verwenden Sie das Tool `tianji_get_survey_info`, um grundlegende Informationen über eine bestimmte Umfrage zu erhalten.

**Parameter:**

- `workspaceId`: Tianji Workspace-ID (Standardwert ist der Wert, der in den Umgebungsvariablen konfiguriert ist)
- `surveyId`: Umfrage-ID

### Gesamte Umfrageliste abrufen

Verwenden Sie das Tool `tianji_get_all_survey_list`, um eine Liste aller Umfragen im Arbeitsbereich zu erhalten.

**Parameter:**

- `workspaceId`: Tianji Workspace-ID (Standardwert ist der Wert, der in den Umgebungsvariablen konfiguriert ist)

### Webseitenliste abrufen

Verwenden Sie das Tool `tianji_get_website_list`, um eine Liste von Webseiten im Arbeitsbereich zu erhalten.

**Parameter:**

- `workspaceId`: Tianji Workspace-ID (Standardwert ist der Wert, der in den Umgebungsvariablen konfiguriert ist)

## Anwendungsbeispiele

Nachfolgend finden Sie Beispiele für natürliche Sprachinteraktionen zwischen Benutzern und KI-Assistenten, die mit dem Tianji MCP Server integriert sind:

### Beispiel 1: Gesamte Umfrageliste abrufen

```
Benutzer: Hilf mir, alle meine Umfragefragebogenlisten anzusehen

KI-Assistent: Ich werde alle Ihre Umfragefragebogenlisten für Sie abrufen.
[Der KI-Assistent ruft über das MCP-Protokoll tianji_get_all_survey_list auf, um Daten zu erhalten]
Basierend auf den Daten in Ihrem Arbeitsbereich haben Sie derzeit folgende Umfragen:
1. Umfrage zur Zufriedenheit der Benutzererfahrung (erstellt am 2023-09-15)
2. Produktfunktion-Feedback-Umfrage (erstellt am 2023-10-01)
3. Website-Benutzbarkeitsbewertung (erstellt am 2023-10-20)
```

### Beispiel 2: Spezifische Umfragedetails abrufen

```
Benutzer: Bitte sag mir die Details der "Umfrage zur Zufriedenheit der Benutzererfahrung"

KI-Assistent: Ich werde die Details dieser Umfrage für Sie abfragen.
[Der KI-Assistent ruft über das MCP-Protokoll tianji_get_survey_info auf, um Daten zu erhalten]
Details der "Umfrage zur Zufriedenheit der Benutzererfahrung":
- Erstellungszeit: 2023-09-15
- Status: Aktiv
- Anzahl der Fragen: 10
- Gesammelte Antworten: 128
- Letzte Antwort: 2023-10-25
```

### Beispiel 3: Umfrageergebnisse abfragen

```
Benutzer: Hilf mir, die Oktoberergebnisse der "Produktfunktion-Feedback-Umfrage" zu analysieren

KI-Assistent: Ich werde die Oktoberergebnisse der "Produktfunktion-Feedback-Umfrage" analysieren.
[Der KI-Assistent ruft über das MCP-Protokoll tianji_get_survey_results auf, um Daten für den spezifischen Zeitraum zu erhalten]
Analyse der Oktoberergebnisse der "Produktfunktion-Feedback-Umfrage":
- Gesamtantworten: 42
- Beliebteste Funktion: Automatisierte Berichte (85% positives Feedback)
- Funktion mit größtem Verbesserungsbedarf: Mobile Anpassung (erwähnt von 62%)
- Durchschnittliche Zufriedenheitsbewertung: 4.2/5
- Hauptnutzerempfehlungen: Datenexportfunktion hinzufügen, Ladegeschwindigkeit der Seite optimieren
```
