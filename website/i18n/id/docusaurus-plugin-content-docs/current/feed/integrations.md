---
sidebar_position: 5
_i18n_hash: 2ebf85a054d427b1cfc8e50c237bede0
---
# Integrasi

Tianji menyediakan adaptor webhook bawaan untuk mengubah payload pihak ketiga menjadi acara Feed.

## GitHub

Endpoint

POST `/open/feed/{channelId}/github`

Catatan

- Gunakan tipe konten "application/json".
- Header `X-GitHub-Event` diperlukan oleh GitHub dan digunakan oleh adaptor.
- Tipe yang didukung: `push`, `star`, `issues` (dibuka/ditutup). Lainnya akan dicatat sebagai tidak dikenal.

## Stripe

Endpoint

POST `/open/feed/{channelId}/stripe`

Catatan

- Konfigurasikan endpoint webhook Stripe yang mengarah ke URL di atas.
- Tipe yang didukung: `payment_intent.succeeded`, `payment_intent.canceled`, `customer.subscription.created`, `customer.subscription.deleted`.

## Sentry

Endpoint

POST `/open/feed/{channelId}/sentry`

Catatan

- Header `Sentry-Hook-Resource: event_alert` dan aksi `triggered` dipetakan ke acara Feed.
- Lihat tangkapan layar langkah demi langkah dalam "Integrasi dengan Sentry".

## Tencent Cloud Alarm

Endpoint

POST `/open/feed/{channelId}/tencent-cloud/alarm`

Catatan

- Mendukung tipe alarm `event` dan `metric`. Payload divalidasi; permintaan yang tidak valid akan ditolak.

## Webhook Playground

Endpoint

POST `/open/feed/playground/{workspaceId}`

Catatan

- Pantulkan header/body/metode/url ke playground waktu nyata workspace untuk debugging integrasi.
