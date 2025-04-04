---
sidebar_position: 1
_i18n_hash: 3c015e32f8f31f3336c113e85a87d389
---
# Integration mit MCP

## Einführung

Tianji MCP Server ist ein Server basierend auf dem Model Context Protocol (MCP), der als Brücke zwischen KI-Assistenten und der Tianji-Plattform dient. Er stellt die Umfragefunktionalität der Tianji-Plattform KI-Assistenten über das MCP-Protokoll zur Verfügung. Dieser Server bietet die folgenden Kernfunktionen:

- Abfrage von Umfrageergebnissen
- Detaillierte Umfrageinformationen abrufen
- Alle Umfragen in einem Arbeitsbereich abrufen
- Webseitenliste erhalten

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
        "TIANJI_API_KEY": "<your-api-key>",
        "TIANJI_WORKSPACE_ID": "<your-workspace-id>"
      }
    }
  }
}
```

### Konfiguration der Umgebungsvariablen

Bevor Sie den Tianji MCP Server verwenden, müssen Sie die folgenden Umgebungsvariablen festlegen:

```bash
# Basis-URL der Tianji-Plattform-API
TIANJI_BASE_URL=https://tianji.example.com

# API-Schlüssel der Tianji-Plattform
TIANJI_API_KEY=your_api_key_here

# Arbeitsbereichs-ID der Tianji-Plattform
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### Einen API-Schlüssel erhalten

Sie können einen API-Schlüssel der Tianji-Plattform erhalten, indem Sie die folgenden Schritte ausführen:

1. Melden Sie sich auf der Tianji-Plattform an und klicken Sie auf Ihr **Profilbild** in der oberen rechten Ecke.
2. Wählen Sie **Profil** aus dem Dropdown-Menü.
3. Auf der Profilseite finden Sie die Option **API-Schlüssel**.
4. Klicken Sie auf Neuer Schlüssel erstellen und folgen Sie den Anweisungen, um die Schlüsselerstellung abzuschließen.

## Gebrauchsanweisung

Der Tianji MCP Server bietet eine Reihe von Tools, die über das MCP-Protokoll mit KI-Assistenten interagieren können. Im Folgenden finden Sie detaillierte Beschreibungen der einzelnen Tools:

### Umfrageergebnisse abfragen

Verwenden Sie das Tool `tianji_get_survey_results`, um Ergebnisdaten für eine bestimmte Umfrage abzufragen.

**Parameter:**

- `workspaceId`: ID des Tianji-Arbeitsbereichs (Standardwert ist der in den Umgebungsvariablen konfigurierte Wert)
- `surveyId`: Umfrage-ID
- `limit`: Begrenzung der Anzahl der zurückgegebenen Datensätze (Standard 20)
- `cursor`: Paginierungscursor (optional)
- `startAt`: Startzeit, ISO-Format, Beispiel: 2023-10-01T00:00:00Z
- `endAt`: Endzeit, ISO-Format, Beispiel: 2023-10-31T23:59:59Z
- `filter`: Filterbedingungen (optional)

### Umfrageinformationen abrufen

Verwenden Sie das Tool `tianji_get_survey_info`, um grundlegende Informationen zu einer bestimmten Umfrage zu erhalten.

**Parameter:**

- `workspaceId`: ID des Tianji-Arbeitsbereichs (Standardwert ist der in den Umgebungsvariablen konfigurierte Wert)
- `surveyId`: Umfrage-ID

### Alle Umfragen abrufen

Verwenden Sie das Tool `tianji_get_all_survey_list`, um eine Liste aller Umfragen im Arbeitsbereich zu erhalten.

**Parameter:**

- `workspaceId`: ID des Tianji-Arbeitsbereichs (Standardwert ist der in den Umgebungsvariablen konfigurierte Wert)

### Webseitenliste abrufen

Verwenden Sie das Tool `tianji_get_website_list`, um eine Liste von Websites im Arbeitsbereich zu erhalten.

**Parameter:**

- `workspaceId`: ID des Tianji-Arbeitsbereichs (Standardwert ist der in den Umgebungsvariablen konfigurierte Wert)

## Anwendungsbeispiele

Im Folgenden finden Sie Beispiele für natürliche Sprachinteraktionen zwischen Benutzern und KI-Assistenten, die mit dem Tianji MCP Server integriert sind:

### Beispiel 1: Alle Umfragen abrufen

```
Benutzer: Hilf mir, alle meine Umfragelisten anzusehen

KI-Assistent: Ich werde alle Ihre Umfragelisten für Sie abrufen.
[Der KI-Assistent ruft die `tianji_get_all_survey_list` über das MCP-Protokoll auf, um Daten zu erhalten]
Basierend auf den Daten in Ihrem Arbeitsbereich haben Sie derzeit folgende Umfragen:
1. Benutzerzufriedenheitsumfrage (erstellt am 2023-09-15)
2. Produkt-Feature-Feedback-Umfrage (erstellt am 2023-10-01)
3. Website-Benutzerfreundlichkeitsbewertung (erstellt am 2023-10-20)
```

### Beispiel 2: Details einer bestimmten Umfrage abrufen

```
Benutzer: Bitte nenne mir die Details der "Benutzerzufriedenheitsumfrage"

KI-Assistent: Ich werde die Details dieser Umfrage für Sie abfragen.
[Der KI-Assistent ruft die `tianji_get_survey_info` über das MCP-Protokoll auf, um Daten zu erhalten]
Details der "Benutzerzufriedenheitsumfrage":
- Erstellungszeit: 2023-09-15
- Status: Aktiv
- Anzahl der Fragen: 10
- Erfasste Antworten: 128
- Jüngste Antwort: 2023-10-25
```

### Beispiel 3: Umfrageergebnisse abfragen

```
Benutzer: Hilf mir, die Oktoberergebnisse der "Produkt-Feature-Feedback-Umfrage" zu analysieren

KI-Assistent: Ich werde die Oktoberergebnisse der "Produkt-Feature-Feedback-Umfrage" analysieren.
[Der KI-Assistent ruft die `tianji_get_survey_results` über das MCP-Protokoll auf, um Daten für den spezifischen Zeitraum zu erhalten]
Analyse der Oktoberergebnisse der "Produkt-Feature-Feedback-Umfrage":
- Gesamtantworten: 42
- Beliebtestes Feature: Automatisierte Berichte (85% positives Feedback)
- Meist verbesserungswürdiges Feature: Mobile Anpassung (erwähnt von 62%)
- Durchschnittliche Zufriedenheitsbewertung: 4,2/5
- Hauptbenutzervorschläge: Datenexportfunktion hinzufügen, Ladegeschwindigkeit der Seite optimieren
```
