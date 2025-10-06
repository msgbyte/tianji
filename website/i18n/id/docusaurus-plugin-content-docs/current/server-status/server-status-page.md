---
sidebar_position: 2
_i18n_hash: cecc3b1b7eb92c03797671e2ab259486
---
# Halaman Status Server

Anda dapat membuat halaman status server untuk pengguna agar dapat menampilkan status server Anda kepada publik yang ingin mengetahui.

## Konfigurasi domain kustom

Anda dapat mengonfigurasi halaman status Anda di domain Anda sendiri, misalnya: `status.example.com`

atur di konfigurasi halaman, dan buat catatan `CNAME` di dasbor DNS Anda.

```
CNAME status.example.com tianji.example.com
```

kemudian Anda dapat mengunjungi `status.example.com` kustom untuk halaman Anda.

### Pemecahan Masalah

Jika Anda mendapatkan error 500, kemungkinan Reverse Proxy Anda tidak dikonfigurasi dengan benar.

Pastikan reverse proxy Anda menyertakan rute status baru Anda.

misalnya:
```
server {
  listen 80;
  server_name tianji.example.com status.example.com;
  listen 443 ssl;
}
```
