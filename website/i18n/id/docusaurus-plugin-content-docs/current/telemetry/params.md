---
sidebar_position: 2
_i18n_hash: ca2b25a29f0f1a82407be367a1d03553
---
# Parameter

Berikut adalah beberapa contoh cara penggunaan dan konfigurasi dengan gambar telemetri.

Semua bersifat opsional. Ini akan meningkatkan penggunaan Anda di tempat yang berbeda.

| nama | deskripsi |
| -------- | --------- |
| url | secara default akan mendapatkan URL pengarah yang dihasilkan secara otomatis oleh browser, tetapi di beberapa situs web tidak diperbolehkan untuk membawa header ini, jadi Anda harus membawanya sendiri. jika Tianji tidak dapat mendapatkan URL di mana pun, sistem akan mengabaikan dan tidak mencatat kunjungan ini |
| name | mendefinisikan nama acara telemetri, ini dapat digunakan untuk membedakan acara yang berbeda tetapi dalam catatan telemetri yang sama. |
| title | **[Hanya Lencana]**, mendefinisikan judul lencana |
| start | **[Hanya Lencana]**, mendefinisikan jumlah awal lencana |
| fullNum | **[Hanya Lencana]**, mendefinisikan lencana yang akan menampilkan angka penuh, default adalah digit yang disingkat (misalnya: `12345` dan `12.3k`) |

## Cara Menggunakan

Mudah untuk membawa parameter di URL

misalnya:

```
https://tianji.example.com/telemetry/<workspaceId>/<telemetryId>/badge.svg?name=myEvent&url=https://google.com&title=My+Counter&start=100000&fullNum=true
```

Jika Anda tidak terbiasa dengan ini, Anda dapat memeriksa halaman wiki tentang ini: [https://en.wikipedia.org/wiki/Query_string](https://en.wikipedia.org/wiki/Query_string)
