---
sidebar_position: 1
_i18n_hash: be40481b428c406d4fdaf208c202a926
---
# KI-Router

Der KI-Router bietet einen stabilen KI-Endpunkt für eine Gruppe von KI-Gateways. Er leitet jede Anfrage durch konfigurierte Gateway-Routen, verteilt den Datenverkehr innerhalb derselben Stufe nach Gewicht und wechselt bei wiederholbaren Fehlern zur nächsten Stufe.

Verwenden Sie ihn, wenn Sie Folgendes wünschen:

- Einen einzigen Endpunkt für Ihre Anwendung anstelle eines fest kodierten KI-Anbieters.
- Gewichtete Verkehrsaufteilung über mehrere Gateways.
- Rückfall von einem primären Anbieter zu Backup-Anbietern während Ausfällen oder Ratenbegrenzungen.
- Ein Migrationspfad, bei dem Sie den Datenverkehr schrittweise durch Ändern von Gewichten verschieben können.

## Wie er sich auf das KI-Gateway bezieht

Das KI-Gateway bleibt die Einheit, die Anbieteranmeldedaten, benutzerdefinierte Basis-URLs, Modellpreise, Quotenwarnungen und Gateway-Protokolle speichert. Der KI-Router ersetzt dies nicht.

Der KI-Router entscheidet nur, welche Gateway-Route die Anfrage erhalten soll.

Der Ablauf zur Laufzeit ist:

1. Ihre Anwendung ruft einen KI-Router-Endpunkt auf.
2. Der KI-Router findet den Router nach Workspace-ID und Router-ID.
3. Der KI-Router wählt eine geeignete Gateway-Route aus der ersten Stufe aus.
4. Das ausgewählte KI-Gateway sendet die Anfrage an den Upstream-KI-Anbieter.
5. Wenn der Versuch erfolgreich ist, gibt der KI-Router diese Antwort zurück.
6. Wenn der Versuch mit einem wiederholbaren Fehler fehlschlägt, versucht der KI-Router eine andere Route in derselben Stufe und dann die nächste Stufe.

## Voraussetzungen

Bevor Sie Routen hinzufügen, erstellen Sie mindestens ein KI-Gateway mit einem gespeicherten Modell-API-Schlüssel. Gateways ohne gespeicherten Schlüssel werden im Routenpicker des KI-Routers nicht angezeigt.

Laufzeitanfragen benötigen weiterhin einen Tianji-API-Schlüssel:

- Für OpenAI-kompatible Endpunkte senden Sie `Authorization: Bearer <YOUR_TIANJI_API_KEY>`.
- Für Anthropic Messages-Endpunkte senden Sie `x-api-key: <YOUR_TIANJI_API_KEY>`.

Tianji überprüft den Anrufer-API-Schlüssel und verwendet dann den gespeicherten Anbieter-Schlüssel des KI-Gateways für die Upstream-Anfrage.

## Einen Router erstellen

1. Öffnen Sie **KI-Router** in der Tianji-Seitenleiste.
2. Klicken Sie auf **KI-Router hinzufügen**.
3. Geben Sie einen Routernamen ein.
4. Lassen Sie **Aktiviert** an, wenn der Router Laufzeitverkehr akzeptieren soll.
5. Speichern Sie den Router.

Nach der Erstellung des Routers öffnen Sie die Registerkarte **Routen**, um Stufen und Gateway-Routen zu konfigurieren.

## Stufen

Eine Stufe ist ein Fallback-Niveau.

Anfragen beginnen immer in der ersten Stufe. Tritt ein wiederholbarer Fehler auf, versucht der KI-Router weiterhin geeignete Routen in dieser Stufe. Wenn jede geeignete Route in der Stufe fehlschlägt, wechselt der KI-Router zur nächsten Stufe.

Verwenden Sie mehrere Stufen, wenn Sie eine strikte Fallback-Reihenfolge wünschen.

Beispiel:

| Stufe | Routen | Bedeutung |
| --- | --- | --- |
| Stufe 1 | OpenAI primär, OpenRouter primär | Normaler Produktionsverkehr |
| Stufe 2 | DeepSeek-Backup | Backup nachdem primäre Anbieter fehlschlagen |
| Stufe 3 | Benutzerdefiniertes internes Modell | Letztmöglicher Fallback |

Ziehen Sie Stufen, um sie neu anzuordnen. Die oberste Stufe wird zuerst versucht.

## Gewichte innerhalb einer Stufe

Routen in derselben Stufe haben keine feste Reihenfolge. Sie teilen den Datenverkehr nach Gewicht.

Beispiel:

| Route | Gewicht | Ungefähre Erstversuchsanteil |
| --- | ---: | ---: |
| Gateway A | 80 | 80% |
| Gateway B | 20 | 20% |

Dies ist nützlich für:

- Zufällige Verkehrsaufteilung zwischen Anbietern.
- Allmähliche Migration von einem Anbieter zu einem anderen.
- Test eines neuen Gateways mit einem kleinen Prozentsatz des Verkehrs.

Wenn Sie eine strikte Reihenfolge benötigen, platzieren Sie die Routen in verschiedenen Stufen anstatt in derselben Stufe.

## Eine Gateway-Route hinzufügen

In der Registerkarte **Routen**:

1. Klicken Sie auf **Gateway hinzufügen** innerhalb einer Stufe.
2. Wählen Sie ein bestehendes KI-Gateway aus.
3. Wählen Sie den Anbietermodus für diese Route aus.
4. Legen Sie die Routenoptionen fest.
5. Speichern.

Sie können eine Route später über die Routenkachel bearbeiten oder löschen.

### Anbieter

Der Anbieter steuert, wie der KI-Router das ausgewählte KI-Gateway für diese Route aufruft. Dasselbe KI-Gateway kann in verschiedenen Routen mit unterschiedlichen Anbietermodi verwendet werden, wenn dies zu Ihrer Einrichtung passt.

Unterstützte Anbieterwerte:

- `openai`
- `deepseek`
- `anthropic`
- `openrouter`
- `custom`

Für `custom` verwendet der KI-Router die benutzerdefinierten Modelleinstellungen, die auf dem ausgewählten KI-Gateway gespeichert sind, wie benutzerdefinierte Basis-URL und benutzerdefinierter Modellname.

### Gewicht

Das Gewicht steuert, wie der Verkehr zwischen Routen in derselben Stufe verteilt wird. Ein höheres Gewicht bedeutet, dass die Route mit höherer Wahrscheinlichkeit zuerst versucht wird.

Standard: `100`.

### Modellüberschreibung

Model-Override ist optional.

Wenn gesetzt, ersetzt der KI-Router das Anforderungsmodell mit diesem Wert, bevor er die Anfrage an die ausgewählte Gateway-Route sendet. Lassen Sie es leer, wenn die Anwendungsanforderung das Modell bestimmen soll.

### Timeout

Timeout ist die maximale Zeit für einen Gateway-Versuch.

Standard: `30000ms`.

Wenn der Versuch zeitüberschreitet, behandelt der KI-Router ihn als wiederholbar und kann die nächste geeignete Route versuchen.

### Wiederholbare Statuscodes

Der KI-Router behandelt Netzwerkfehler, Zeitüberschreitungen und diese Statuscodes immer als wiederholbar:

- `429`
- `500`
- `502`
- `503`
- `504`

Verwenden Sie **Wiederholbare Statuscodes**, um weitere Statuscodes für eine Route hinzuzufügen. Zum Beispiel könnten Sie `408` hinzufügen, wenn ein Anbieter häufig Zeitüberschreitungen als HTTP-Antwort meldet.

Seien Sie vorsichtig bei Validierungsfehlern wie `400` oder `401`. Diese bedeuten normalerweise, dass die Anfrage oder der Schlüssel falsch ist, und das erneute Versuchen eines anderen Anbieters kann das eigentliche Problem verbergen.

## Protokolle

Die Registerkarte **Protokolle** zeigt zur Laufzeit-Bemühungen für einen Router:

- Status: `Erfolg`, `Fehlgeschlagen` oder `Teilweise`.
- Protokoll: das übereinstimmende Anforderungsprotokoll.
- Versuche: wie viele Gateway-Routen versucht wurden.
- Endgültiges Gateway: das Gateway, das das endgültige Ergebnis produziert hat.
- Endgültige Gateway-Protokoll: die verknüpfte KI-Gateway-Protokoll-ID.
- Dauer.

Verwenden Sie Router-Protokolle, um das Failover-Verhalten zu verstehen. Verwenden Sie die verknüpften KI-Gateway-Protokolle, um Token-Verbrauch, Upstream-Modell-Details, Kosten und Anbieter-Antwortdaten zu überprüfen.
