---
sidebar_position: 2
_i18n_hash: c5728e8d9970ba12114c782ea0f3f562
---
# Verwendung des AI Routers

Der AI Router stellt OpenAI- und Anthropic-kompatible Endpunkte unter Ihrem Tianji-Server bereit:

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/<provider>/v1/...
```

Das Segment `<provider>` muss mit dem Provider-Modus übereinstimmen, den Sie auf der Route konfiguriert haben.

## Unterstützte Endpunkte

| Provider-Segment | Chat-Vervollständigungen | Antworten | Anthropic-Nachrichten |
| --- | --- | --- | --- |
| `openai` | `/openai/v1/chat/completions` | `/openai/v1/responses` | - |
| `deepseek` | `/deepseek/v1/chat/completions` | - | - |
| `anthropic` | `/anthropic/v1/chat/completions` | - | `/anthropic/v1/messages` |
| `openrouter` | `/openrouter/v1/chat/completions` | - | `/openrouter/v1/messages` |
| `custom` | `/custom/v1/chat/completions` | `/custom/v1/responses` | `/custom/v1/messages` |

## OpenAI Chat-Vervollständigungen

Basis-URL für OpenAI SDK:

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1
```

Node.js:

```js
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.TIANJI_API_KEY,
  baseURL:
    'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1',
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hello from Tianji AI Router' }],
});

console.log(response.choices[0].message);
```

cURL:

```bash
curl -X POST 'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_TIANJI_API_KEY>' \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": "Hello from Tianji AI Router"
      }
    ]
  }'
```

## OpenAI Antworten

Basis-URL für OpenAI SDK:

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1
```

Node.js:

```js
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.TIANJI_API_KEY,
  baseURL:
    'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1',
});

const response = await client.responses.create({
  model: 'gpt-4o',
  input: 'Write a short deployment checklist.',
});

console.log(response.output_text);
```

cURL:

```bash
curl -X POST 'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/openai/v1/responses' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_TIANJI_API_KEY>' \
  -d '{
    "model": "gpt-4o",
    "input": "Write a short deployment checklist."
  }'
```

## Anthropic Nachrichten

Basis-URL für Anthropic SDK:

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/anthropic
```

Node.js:

```js
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.TIANJI_API_KEY,
  baseURL:
    'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/anthropic',
});

const message = await client.messages.create({
  model: 'claude-opus-4-20250514',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hello from Tianji AI Router' }],
});

console.log(message.content);
```

cURL:

```bash
curl -X POST 'https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/anthropic/v1/messages' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: <YOUR_TIANJI_API_KEY>' \
  -H 'anthropic-version: 2023-06-01' \
  -d '{
    "model": "claude-opus-4-20250514",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "Hello from Tianji AI Router"
      }
    ]
  }'
```

## Benutzerdefinierte Provider-Routen

Verwenden Sie das `custom`-Provider-Segment, wenn das ausgewählte AI Gateway eine benutzerdefinierte Basis-URL oder einen benutzerdefinierten Modellnamen speichert.

Beispiele:

```bash
/api/ai-router/<workspaceId>/<routerId>/custom/v1/chat/completions
/api/ai-router/<workspaceId>/<routerId>/custom/v1/responses
/api/ai-router/<workspaceId>/<routerId>/custom/v1/messages
```

Die benutzerdefinierten Upstream-Details bleiben auf dem AI Gateway. Der AI Router wählt nur die Route und leitet die normalisierte Anfrage weiter.

## Empfohlene Routing-Muster

### Aktiver Backup

Verwenden Sie dies, wenn die Verfügbarkeit wichtiger ist als die Verkehrsverteilung.

| Stufe | Route | Gewicht |
| --- | --- | ---: |
| 1 | Primäres OpenAI-Gateway | 100 |
| 2 | OpenRouter-Gateway | 100 |
| 3 | Benutzerdefiniertes Fallback-Gateway | 100 |

Der AI Router versucht die Stufe 2 nur, wenn die Stufe 1 wiederholbare Fehler zurückgibt.

### Gewichtet aufgeteilt

Verwenden Sie dies, wenn Sie den Verkehr im normalen Betrieb zwischen Anbietern aufteilen möchten.

| Stufe | Route | Gewicht |
| --- | --- | ---: |
| 1 | Gateway A | 80 |
| 1 | Gateway B | 20 |

Beide Routen befinden sich in derselben Stufe, daher gibt es keine primäre/sekundäre Reihenfolge. Die Gewichte entscheiden, welche Route wahrscheinlich zuerst versucht wird.

### Canary-Migration

Verwenden Sie dies beim Testen eines neuen Anbieters.

| Stufe | Route | Gewicht |
| --- | --- | ---: |
| 1 | Aktueller Anbieter | 95 |
| 1 | Neuer Anbieter | 5 |
| 2 | Stabiles Fallback | 100 |

Erhöhen Sie das Gewicht des neuen Anbieters, nachdem Sie in den Protokollen Qualität und Zuverlässigkeit bestätigt haben.

## Fehlerbehebung

### Keine verfügbaren AI Router-Knoten

Überprüfen Sie, ob:

- Der Router aktiviert ist.
- Mindestens eine Stufe aktivierte Routen hat.
- Das ausgewählte AI Gateway noch einen gespeicherten Modell-API-Schlüssel hat.
- Der Route-Provider den von Ihnen aufgerufenen Endpunkt unterstützt.

### Der Router stoppt nach einem fehlgeschlagenen Versuch

Der AI Router fährt nur nach wiederholbaren Fehlern fort.

Netzwerkfehler, Zeitüberschreitungen, `429`, `500`, `502`, `503` und `504` sind standardmäßig wiederholbar. Fügen Sie routenspezifische wiederholbare Statuscodes hinzu, wenn ein Anbieter andere temporäre Fehlercodes verwendet.

### Falsches Modell wird verwendet

Überprüfen Sie beide Stellen:

- Routen-**Modellüberschreibung**. Wenn eingestellt, ersetzt es das `model` der Anfrage.
- AI Gateway benutzerdefinierter Modellname. Bei `custom`-Routen kann das Gateway das Modell mit seinem benutzerdefinierten Modellnamen ersetzen.

### Anfrage gibt 401 oder 403 zurück

Verwenden Sie im Laufzeitantrag einen Tianji-API-Schlüssel. Senden Sie nicht den Upstream-Anbieterschlüssel an den AI Router, wenn das Gateway seine eigenen Anbieterdaten speichert.

Für OpenAI-kompatible Endpunkte verwenden Sie:

```bash
Authorization: Bearer <YOUR_TIANJI_API_KEY>
```

Für Anthropic-Nachrichtenendpunkte verwenden Sie:

```bash
x-api-key: <YOUR_TIANJI_API_KEY>
```
