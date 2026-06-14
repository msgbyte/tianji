---
sidebar_position: 5
_i18n_hash: 3656796ebf02a33e45fbef1ecb18923e
---
# Webhook

Jika Anda memerlukan metode pemberitahuan yang lebih fleksibel, Anda dapat mencoba menggunakan webhook kustom untuk memberitahukan pesan Anda. Dengan cara ini, Anda dapat mengintegrasikan pemberitahuan Tianji ke dalam sistem apapun.

### Contoh Hasil

Sistem Tianji akan mengirimkan permintaan POST dengan konten contoh di bawah ini.

```json
{
    "notification": {
        "workspaceId": "xxxxxxxxxxx",
        "name": "Pemberitahuan Baru",
        "type": "webhook",
        "payload": {
            "webhookUrl": "example.com"
        }
    },
    "title": "Pengujian Pemberitahuan Baru",
    "content": "Tianji: Wawasan ke dalam segala hal\\nIni adalah Pengujian Pemberitahuan dari Pemberitahuan Baru\\n[gambar]",
    "raw": [
        {
            "type": "title",
            "level": 2,
            "content": "Tianji: Wawasan ke dalam segala hal"
        },
        {
            "type": "text",
            "content": "Ini adalah Pengujian Pemberitahuan dari Pemberitahuan Baru"
        },
        {
            "type": "newline"
        },
        {
            "type": "image",
            "url": "https://tianji.dev/img/social-card.png"
        }
    ],
    "time": "2024-06-19T15:41:09.390Z"
}
```
