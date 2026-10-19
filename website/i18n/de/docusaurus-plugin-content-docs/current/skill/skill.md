---
sidebar_position: 1
_i18n_hash: 3bea21234680fc0342392f5d9887ba15
---
# Integration mit Agenten-Skill

## Einführung

Der **Tianji Data Query Skill** ist ein leichtgewichtiges, agentenunabhängiges Skill-Paket, das es KI-Agenten (Cursor, Claude Code, Codex, Copilot CLI usw.) ermöglicht, die Tianji-Plattform direkt über ihre schreibgeschützte OpenAPI abzufragen.

Er folgt der [agentskills.io](https://agentskills.io/specification) Spezifikation — einer einzigen `SKILL.md` plus Referenzdateien. Kein langlaufender Prozess, keine zusätzliche Laufzeit.

:::tip Loslegen
Siehe den [Installationsleitfaden](./installation.md) für die Ein-Klick- und manuelle Einrichtung.
:::

**Abgedeckt werden:** 69 GET-Endpunkte über 14 Dienstbereiche:

- **Website** — Traffic-Statistiken, Seitenaufrufe, geografische Verteilung, Lighthouse-Berichte
- **Monitor** — Betriebszeitstatus, aktuelle Prüfdaten, Überwachungsereignisse
- **Survey** — Umfrageantworten, Ergebnisstatistiken, KI-Kategorien
- **Telemetry** — Benutzerdefinierte Ereigniszählungen, Telemetrie-Seitenaufrufe, Metriken
- **Feed** — Kanäle, Ereignis-Streams, Feed-Zustände
- **Application** — App-Store-Bewertungen, App-Infos, Ereignisstatistiken
- **Abrechnung / KI-Gateway / Arbeiter / Seite / Arbeitsbereich / Global / AuditLog**

## Skill vs. MCP-Server

Tianji bietet zwei Möglichkeiten zur Integration mit KI-Agenten. Wählen Sie die, die zu Ihrem Arbeitsablauf passt:

| | Agenten-Skill | [MCP-Server](/docs/mcp) |
|--|--|--|
| **Form** | Einfache Dokumentationsdateien (`SKILL.md` + Referenzen) | Ein langlaufender Node.js-Prozess |
| **Laufzeit** | Keine — Agent verwendet `curl` oder integrierte HTTP-Tools | `npx tianji-mcp-server` |
| **Abdeckung** | 69 GET-Endpunkte (schreibgeschützt, vollständige Oberfläche) | Eine kuratierte Untergruppe von Tools (Lesen + teilweise Schreiben) |
| **Einrichtung** | Dateien in das Skills-Verzeichnis des Agenten einfügen | MCP-Konfiguration zur Konfigurationsdatei des Agenten hinzufügen |
| **Am besten für** | Cursor / Claude Code / Codex / jeden Agenten, der die agentskills.io-Spezifikation befolgt | Agenten mit erstklassiger MCP-Unterstützung |

Sie können beide gleichzeitig ohne Konflikt verwenden.

## Anwendungsbeispiele

Nach der Installation können Sie Ihrem KI-Agenten Fragen in natürlicher Sprache stellen und er wird den richtigen Endpunkt auswählen:

### Beispiel 1: Website-Traffic-Übersicht

```
Benutzer: Zeigen Sie mir die Seitenaufrufe meiner Hauptwebsite in den letzten 7 Tagen.

Agent: [Ruft GET /open/workspace/{workspaceId}/website/all auf, um die Seite zu finden]
       [Dann GET /open/workspace/{workspaceId}/website/{websiteId}/pageviews
        mit startAt/endAt über 7 Tage]
       Ihre Hauptwebsite erhielt 12.438 Seitenaufrufe in den letzten 7 Tagen,
       mit einem Höchststand von 2.103 am Dienstag. Wichtigster Referrer: google.com (43%).
```

### Beispiel 2: Überwachungs-Gesundheitscheck

```
Benutzer: Sind momentan irgendwelche meiner Überwachungen ausgefallen?

Agent: [Ruft GET /open/workspace/{workspaceId}/monitor/all auf]
       [Dann GET /open/workspace/{workspaceId}/monitor/{monitorId}/status
        für jeden Monitor]
       2 Monitore sind momentan DOWN:
       - api.example.com (HTTP 503, zuletzt UP vor 12 Min)
       - db-replica (TCP-Zeitüberschreitung, zuletzt UP vor 1 Std)
       Die anderen 8 Monitore sind gesund.
```

### Beispiel 3: Umfrageergebnis-Analyse

```
Benutzer: Fassen Sie die Antworten zur Umfrage "Q4 Kundenfeedback" zusammen.

Agent: [Ruft GET /open/workspace/{workspaceId}/survey/all auf, um die ID zu ermitteln]
       [Dann GET /open/workspace/{workspaceId}/survey/{surveyId}/stats]
       [Dann GET /open/workspace/{workspaceId}/survey/{surveyId}/result/list
        mit einem Paginierungs-Cursor]
       "Q4 Kundenfeedback" erhielt 218 Antworten. Durchschnittliche Zufriedenheit
       4,3/5. Hauptthema: Dashboard-Performance (47 Erwähnungen). Am meisten
       gewünschtes Feature: Dunkelmodus (31 Erwähnungen).
```

## Umgang mit sensiblen Daten

Einige Endpunkte können auf der Plattform gespeicherte Geheimnisse (z.B. `modelApiKey`, `customModelBaseUrl` in KI-Gateway-Antworten) oder PII (Arbeitsbereichsmitglieder, Audit-Logs, Abrechnung) zurückgeben.

Der Skill weist Agenten an:

- **Nie anzeigen** von `apiKey`, `modelApiKey`, `secret`, `token`, `password` oder `credential` Feldern.
- **Diese Felder bei der Zusammenfassung von Antworten redaktieren oder auslassen**.
- Für Arbeitsbereichsmitglieder / Audit-Logs, nur nicht-sensible Metadaten (Namen, Rollen, Zeitstempel) anzeigen, es sei denn, der Benutzer fordert ausdrücklich vollständige Details an.

Das mitgelieferte `openapi-readonly.json` redaktiert diese Felder auch auf Schemaebene, sodass Agenten nicht versehentlich auf deren Struktur angewiesen sind.

## Quelle

Die Skill-Quelle befindet sich im Tianji-Repository unter [`skills/tianji-data-query/`](https://github.com/msgbyte/tianji/tree/master/skills/tianji-data-query). Pull-Requests sind willkommen.
