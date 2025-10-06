---
sidebar_position: 5
_i18n_hash: 4ea8ae049c2d4b09f2847744ac37545f
---
# Webhook

Jika Anda memerlukan metode notifikasi yang lebih fleksibel, Anda dapat mencoba menggunakan webhook kustom untuk memberi tahu pesan Anda. Dengan cara ini, Anda dapat mengintegrasikan notifikasi Tianji ke dalam sistem apa pun.

### Contoh Hasil

Sistem Tianji akan mengirimkan permintaan POST dengan isi contoh berikut.

```json
{
    "notification": {
        "workspaceId": "xxxxxxxxxxx",
        "name": "Notifikasi Baru",
        "type": "webhook",
        "payload": {
            "webhookUrl": "example.com"
        }
    },
    "title": "Pengujian Notifikasi Notifikasi Baru",
    "content": "Tianji: Wawasan ke segala hal\\nIni adalah Pengujian Notifikasi dari Notifikasi Baru\\n[image]",
    "raw": [
        {
            "type": "title",
            "level": 2,
            "content": "Tianji: Wawasan ke segala hal"
        },
        {
            "type": "text",
            "content": "Ini adalah Pengujian Notifikasi dari Notifikasi Baru"
        },
        {
            "type": "newline"
        },
        {
            "type": "image",
            "url": "https://tianji.msgbyte.com/img/social-card.png"
        }
    ],
    "time": "2024-06-19T15:41:09.390Z"
}
```
