---
sidebar_position: 2
_i18n_hash: 4ad4885ffd9d3dee0d40df9443ddf820
---
# Installation

Das Skill besteht aus nur drei Dateien. Jeder moderne KI-Agent (Cursor, Claude Code, Codex, Copilot CLI...) kennt bereits seinen eigenen Fähigkeitenordner – die Installation kann also so einfach sein wie das Einfügen eines einzelnen Prompts.

## Ein-Klick-Installation (über KI-Agent)

Fügen Sie den folgenden Prompt in Ihren KI-Agenten ein. Es wird die Dateien in das richtige Verzeichnis für seine Plattform herunterladen und Sie dann nach fehlenden Konfigurationen fragen.

```
Bitte installiere das Tianji Data Query Skill in deinem Fähigkeitenverzeichnis:

https://github.com/msgbyte/tianji/tree/master/skills/tianji-data-query

Nachdem die Dateien heruntergeladen wurden, überprüfe, ob diese Umgebungsvariablen gesetzt sind:
  - TIANJI_BASE_URL
  - TIANJI_API_KEY
  - TIANJI_WORKSPACE_ID

Falls welche fehlen, frage mich nach den Werten.
```

Das ist alles. Der Agent wählt sein eigenes Fähigkeitenverzeichnis, ruft die Dateien ab und fordert Sie bei Bedarf zur Eingabe von Zugangsdaten auf.

## Manuelle Installation

Wenn Sie es lieber selbst installieren möchten, wählen Sie das Zielverzeichnis für Ihren Agenten aus und führen Sie Folgendes aus:

```bash
DEST="$HOME/.cursor/skills/tianji-data-query"   # oder was auch immer Ihr Agent verwendet
mkdir -p "$DEST/references"

BASE="https://raw.githubusercontent.com/msgbyte/tianji/master/skills/tianji-data-query"
curl -fSL "$BASE/SKILL.md"                          -o "$DEST/SKILL.md"
curl -fSL "$BASE/references/api-endpoints.md"       -o "$DEST/references/api-endpoints.md"
curl -fSL "$BASE/references/openapi-readonly.json"  -o "$DEST/references/openapi-readonly.json"
```

### Fähigkeitenverzeichnis nach Agent

| Agent | Verzeichnis |
|-------|-------------|
| Cursor (persönlich) | `~/.cursor/skills/tianji-data-query/` |
| Cursor (Projekt)   | `<project-root>/.cursor/skills/tianji-data-query/` |
| Claude Code       | `~/.claude/skills/tianji-data-query/` |
| Codex             | `~/.codex/skills/tianji-data-query/` |
| Codex (alt)       | `~/.agents/skills/tianji-data-query/` |

## Erforderliche Umgebungsvariablen

Das Skill erwartet drei Werte. Exportieren Sie sie in Ihrem Shell-RC oder setzen Sie sie in der Skill-Konfiguration Ihres Agenten:

```bash
# Basis-URL der Tianji-Instanz
TIANJI_BASE_URL=https://tianji.example.com

# API-Schlüssel für die Authentifizierung
TIANJI_API_KEY=your_api_key_here

# Standardarbeitsbereichs-ID
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### Einen API-Schlüssel erhalten

1. Melden Sie sich bei Ihrer Tianji-Instanz an und klicken Sie oben rechts auf Ihr **Profilbild**.
2. Wählen Sie **Profil** aus dem Dropdown-Menü.
3. Finden Sie den Abschnitt **API-Schlüssel**.
4. Klicken Sie auf **Neuen Schlüssel erstellen** und folgen Sie den Anweisungen.

## Nächste Schritte

Nach der Installation kehren Sie zu [Integration mit Agent Skill](./skill.md) zurück, um Anwendungsbeispiele, den Vergleich mit dem MCP-Server und die Behandlung sensibler Daten durch das Skill zu sehen.
