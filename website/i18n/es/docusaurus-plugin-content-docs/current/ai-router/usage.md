---
sidebar_position: 2
_i18n_hash: c5728e8d9970ba12114c782ea0f3f562
---
# Uso del AI Router

AI Router expone endpoints compatibles con OpenAI y Anthropic bajo tu servidor Tianji:

```bash
https://tu-dominio-tianji.com/api/ai-router/<workspaceId>/<routerId>/<provider>/v1/...
```

El segmento `<provider>` debe coincidir con el modo de proveedor que configuraste en la ruta.

## Endpoints soportados

| Segmento de proveedor | Completitudes de Chat | Respuestas | Mensajes Anthropic |
| --- | --- | --- | --- |
| `openai` | `/openai/v1/chat/completions` | `/openai/v1/responses` | - |
| `deepseek` | `/deepseek/v1/chat/completions` | - | - |
| `anthropic` | `/anthropic/v1/chat/completions` | - | `/anthropic/v1/messages` |
| `openrouter` | `/openrouter/v1/chat/completions` | - | `/openrouter/v1/messages` |
| `custom` | `/custom/v1/chat/completions` | `/custom/v1/responses` | `/custom/v1/messages` |

## Completitudes de Chat de OpenAI

URL base para SDK de OpenAI:

```bash
https://tu-dominio-tianji.com/api/ai-router/<workspaceId>/<routerId>/openai/v1
```

Node.js:

```js
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.TIANJI_API_KEY,
  baseURL:
    'https://tu-dominio-tianji.com/api/ai-router/<workspaceId>/<routerId>/openai/v1',
});

const response = await client.chat.completions.create({
  model: 'gpt-4o',
  messages: [{ role: 'user', content: 'Hola desde Tianji AI Router' }],
});

console.log(response.choices[0].message);
```

cURL:

```bash
curl -X POST 'https://tu-dominio-tianji.com/api/ai-router/<workspaceId>/<routerId>/openai/v1/chat/completions' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_TIANJI_API_KEY>' \
  -d '{
    "model": "gpt-4o",
    "messages": [
      {
        "role": "user",
        "content": "Hola desde Tianji AI Router"
      }
    ]
  }'
```

## Respuestas de OpenAI

URL base para SDK de OpenAI:

```bash
https://tu-dominio-tianji.com/api/ai-router/<workspaceId>/<routerId>/openai/v1
```

Node.js:

```js
import OpenAI from 'openai';

const client = new OpenAI({
  apiKey: process.env.TIANJI_API_KEY,
  baseURL:
    'https://tu-dominio-tianji.com/api/ai-router/<workspaceId>/<routerId>/openai/v1',
});

const response = await client.responses.create({
  model: 'gpt-4o',
  input: 'Escribe una lista de verificación corta para el despliegue.',
});

console.log(response.output_text);
```

cURL:

```bash
curl -X POST 'https://tu-dominio-tianji.com/api/ai-router/<workspaceId>/<routerId>/openai/v1/responses' \
  -H 'Content-Type: application/json' \
  -H 'Authorization: Bearer <YOUR_TIANJI_API_KEY>' \
  -d '{
    "model": "gpt-4o",
    "input": "Escribe una lista de verificación corta para el despliegue."
  }'
```

## Mensajes Antropicos

URL base para SDK de Anthropic:

```bash
https://tu-dominio-tianji.com/api/ai-router/<workspaceId>/<routerId>/anthropic
```

Node.js:

```js
import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({
  apiKey: process.env.TIANJI_API_KEY,
  baseURL:
    'https://tu-dominio-tianji.com/api/ai-router/<workspaceId>/<routerId>/anthropic',
});

const message = await client.messages.create({
  model: 'claude-opus-4-20250514',
  max_tokens: 1024,
  messages: [{ role: 'user', content: 'Hola desde Tianji AI Router' }],
});

console.log(message.content);
```

cURL:

```bash
curl -X POST 'https://tu-dominio-tianji.com/api/ai-router/<workspaceId>/<routerId>/anthropic/v1/messages' \
  -H 'Content-Type: application/json' \
  -H 'x-api-key: <YOUR_TIANJI_API_KEY>' \
  -H 'anthropic-version: 2023-06-01' \
  -d '{
    "model": "claude-opus-4-20250514",
    "max_tokens": 1024,
    "messages": [
      {
        "role": "user",
        "content": "Hola desde Tianji AI Router"
      }
    ]
  }'
```

## Rutas de proveedor personalizado

Usa el segmento de proveedor `custom` cuando la Pasarela de AI seleccionada almacena una URL base personalizada o un nombre de modelo personalizado.

Ejemplos:

```bash
/api/ai-router/<workspaceId>/<routerId>/custom/v1/chat/completions
/api/ai-router/<workspaceId>/<routerId>/custom/v1/responses
/api/ai-router/<workspaceId>/<routerId>/custom/v1/messages
```

Los detalles origen personalizados permanecen en la pasarela de AI. AI Router solo selecciona la ruta y reenvía la solicitud normalizada.

## Patrones de enrutamiento recomendados

### Respaldo activo

Usa esto cuando el tiempo de actividad importa más que la distribución del tráfico.

| Nivel | Ruta | Peso |
| --- | --- | ---: |
| 1 | Pasarela principal de OpenAI | 100 |
| 2 | Pasarela de OpenRouter | 100 |
| 3 | Pasarela de respaldo personalizada | 100 |

AI Router intenta el Nivel 2 solo después de que el Nivel 1 devuelve fallas reenviables.

### División ponderada

Usa esto cuando quieras compartir tráfico entre proveedores en operación normal.

| Nivel | Ruta | Peso |
| --- | --- | ---: |
| 1 | Pasarela A | 80 |
| 1 | Pasarela B | 20 |

Ambas rutas están en el mismo nivel, por lo que no hay orden primario/secundario. Los pesos deciden qué ruta es probable que se intente primero.

### Migración canaria

Usa esto al probar un nuevo proveedor.

| Nivel | Ruta | Peso |
| --- | --- | ---: |
| 1 | Proveedor actual | 95 |
| 1 | Nuevo proveedor | 5 |
| 2 | Respaldo estable | 100 |

Aumenta el peso del nuevo proveedor después de confirmar la calidad y confiabilidad en los registros.

## Solución de problemas

### No hay nodos de AI Router elegibles disponibles

Verifica que:

- El router esté habilitado.
- Al menos un nivel tenga rutas habilitadas.
- La Pasarela de AI seleccionada todavía tenga una clave de API de modelo almacenada.
- El proveedor de la ruta soporte el endpoint que estás llamando.

### El router se detiene después de un intento fallido

AI Router solo continúa después de fallas reenviables.

Los errores de red, tiempos de espera, `429`, `500`, `502`, `503`, y `504` son reenviables por defecto. Agrega códigos de estado reenviables específicos de la ruta si un proveedor usa otros códigos de falla temporal.

### Se está usando el modelo incorrecto

Verifica en ambos lugares:

- Anulación de modelo de la ruta. Si está establecido, reemplaza el `modelo` de la solicitud.
- Nombre de modelo personalizado de la Pasarela de AI. Para rutas `custom`, la pasarela puede reemplazar el modelo con su nombre de modelo personalizado.

### La solicitud devuelve 401 o 403

Usa una clave de API de Tianji en la solicitud de tiempo de ejecución. No envíes la clave del proveedor aguas arriba a AI Router cuando la pasarela almacena su propia credencial de proveedor.

Para endpoints compatibles con OpenAI, usa:

```bash
Authorization: Bearer <YOUR_TIANJI_API_KEY>
```

Para endpoints de Mensajes Antropicos, usa:

```bash
x-api-key: <YOUR_TIANJI_API_KEY>
```
