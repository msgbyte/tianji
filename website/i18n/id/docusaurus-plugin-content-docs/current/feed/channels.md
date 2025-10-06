---
sidebar_position: 2
_i18n_hash: f5e0cd17d30a2d7438fa8962eadfd7b5
---
# Saluran

Saluran adalah wadah dari kejadian-kejadian. Anda dapat membuat beberapa saluran untuk produk/tim/lingkungan yang berbeda.

## Membuat saluran

Konsol → Umpan → Tambah Saluran.

Kolom

- name: Nama tampilan
- notifyFrequency: Mengontrol seberapa sering notifikasi dikirimkan untuk saluran ini
- notificationIds: Pilih target notifikasi yang sudah ada untuk menerima fan-out

## Mengedit saluran

Anda dapat memperbarui nama, notificationIds, notifyFrequency, dan menetapkan webhookSignature opsional. Setelah tanda tangan ditetapkan, setiap webhook publik ke saluran ini harus menyertakan header `x-webhook-signature` dengan nilai yang sama.

## API

- Daftar saluran: GET `/open/workspace/{workspaceId}/feed/channels`
- Info saluran: GET `/open/workspace/{workspaceId}/feed/{channelId}/info`
- Memperbarui: POST `/open/workspace/{workspaceId}/feed/{channelId}/update`
- Membuat: POST `/open/workspace/{workspaceId}/feed/createChannel`
- Menghapus: DELETE `/open/workspace/{workspaceId}/feed/{channelId}/del`

Contoh (memperbarui target notifikasi)

```bash
curl -X POST \
  "$BASE_URL/workspace/$WORKSPACE_ID/feed/$CHANNEL_ID/update" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Ops",
    "notifyFrequency": 60,
    "notificationIds": ["notif_123", "notif_456"]
  }'
```
