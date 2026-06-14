---
sidebar_position: 2
_i18n_hash: c5728e8d9970ba12114c782ea0f3f562
---
# Penggunaan Router AI

Router AI mengekspos endpoint yang kompatibel dengan OpenAI dan Anthropic di bawah server Tianji Anda:

```bash
https://your-tianji-domain.com/api/ai-router/<workspaceId>/<routerId>/<provider>/v1/...
```

Segmen `<provider>` harus sesuai dengan mode penyedia yang Anda konfigurasikan pada rute.

## Endpoint yang Didukung

| Segmen Penyedia | Chat Completions | Responses | Anthropic Messages |
| --- | --- | --- | --- |
| `openai` | `/openai/v1/chat/completions` | `/openai/v1/responses` | - |
| `deepseek` | `/deepseek/v1/chat/completions` | - | - |
| `anthropic` | `/anthropic/v1/chat/completions` | - | `/anthropic/v1/messages` |
| `openrouter` | `/openrouter/v1/chat/completions` | - | `/openrouter/v1/messages` |
| `custom` | `/custom/v1/chat/completions` | `/custom/v1/responses` | `/custom/v1/messages` |

## OpenAI Chat Completions

URL dasar untuk SDK OpenAI:

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

## OpenAI Responses

URL dasar untuk SDK OpenAI:

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

## Pesan Anthropic

URL dasar untuk SDK Anthropic:

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

## Rute penyedia kustom

Gunakan segmen penyedia `custom` ketika AI Gateway yang dipilih menyimpan URL dasar kustom atau nama model kustom.

Contoh:

```bash
/api/ai-router/<workspaceId>/<routerId>/custom/v1/chat/completions
/api/ai-router/<workspaceId>/<routerId>/custom/v1/responses
/api/ai-router/<workspaceId>/<routerId>/custom/v1/messages
```

Detail upstream kustom tetap berada di AI Gateway. Router AI hanya memilih rute dan meneruskan permintaan yang dinormalisasi.

## Pola routing yang disarankan

### Cadangan aktif

Gunakan ini ketika uptime lebih penting dibandingkan distribusi lalu lintas.

| Tier | Rute | Bobot |
| --- | --- | ---: |
| 1 | Gerbang OpenAI Primer | 100 |
| 2 | Gerbang OpenRouter | 100 |
| 3 | Gerbang cadangan kustom | 100 |

Router AI mencoba Tier 2 hanya setelah Tier 1 mengembalikan kegagalan yang dapat diulang.

### Pembagian berbobot

Gunakan ini ketika Anda ingin berbagi lalu lintas di antara penyedia dalam operasi normal.

| Tier | Rute | Bobot |
| --- | --- | ---: |
| 1 | Gerbang A | 80 |
| 1 | Gerbang B | 20 |

Kedua rute berada di tier yang sama, jadi tidak ada urutan primer/sekunder. Bobot memutuskan rute mana yang cenderung dicoba terlebih dahulu.

### Migrasi kanari

Gunakan ini ketika menguji penyedia baru.

| Tier | Rute | Bobot |
| --- | --- | ---: |
| 1 | Penyedia saat ini | 95 |
| 1 | Penyedia baru | 5 |
| 2 | Cadangan stabil | 100 |

Tingkatkan bobot penyedia baru setelah Anda mengkonfirmasi kualitas dan keandalan di log.

## Pemecahan masalah

### Tidak ada node Router AI yang memenuhi syarat tersedia

Periksa bahwa:

- Router diaktifkan.
- Setidaknya satu tier memiliki rute yang diaktifkan.
- AI Gateway yang dipilih masih menyimpan kunci API model.
- Penyedia rute mendukung endpoint yang Anda panggil.

### Router berhenti setelah satu upaya gagal

Router AI hanya melanjutkan setelah kegagalan yang bisa diulang.

Kesalahan jaringan, batas waktu, `429`, `500`, `502`, `503`, dan `504` adalah yang dapat diulang secara default. Tambahkan kode status yang dapat diulang spesifik rute jika penyedia menggunakan kode kegagalan sementara yang lain.

### Model yang salah sedang digunakan

Periksa kedua tempat:

- **Model Override** Rute. Jika diatur, itu menggantikan `model` permintaan.
- Nama model kustom AI Gateway. Untuk rute `custom`, gateway dapat menggantikan model dengan nama model kustomnya.

### Permintaan mengembalikan 401 atau 403

Gunakan kunci API Tianji dalam permintaan runtime. Jangan kirim kunci penyedia upstream ke Router AI ketika gateway menyimpan kredensial penyedianya sendiri.

Untuk endpoint yang kompatibel dengan OpenAI, gunakan:

```bash
Authorization: Bearer <YOUR_TIANJI_API_KEY>
```

Untuk endpoint Pesan Anthropic, gunakan:

```bash
x-api-key: <YOUR_TIANJI_API_KEY>
```
