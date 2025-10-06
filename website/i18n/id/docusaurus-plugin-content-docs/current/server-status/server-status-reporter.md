---
sidebar_position: 1
_i18n_hash: 21a5dc8265605536c8c328c551abdcc9
---
# Pelapor Status Server

Anda dapat melaporkan status server Anda dengan mudah menggunakan pelapor tianji.

Anda dapat mengunduh dari [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases)

## Penggunaan

```
Penggunaan tianji-reporter:
  --interval int
        Masukkan INTERVAL, detik (default 5)
  --mode http
        Mode pengiriman data laporan, Anda dapat memilih: `http` atau `udp`, default adalah `http` (default "http")
  --name string
        Nama identifikasi untuk mesin ini
  --url string
        URL http tianji, contohnya: https://tianji.msgbyte.com
  --vnstat
        Gunakan vnstat untuk statistik lalu lintas, hanya linux
  --workspace string
        ID ruang kerja untuk tianji, ini harus berupa uuid
```

**url** dan **workspace** diperlukan, ini berarti Anda akan melaporkan layanan Anda ke host dan ruang kerja mana.

Secara default, nama node server akan sama dengan hostname, jadi Anda dapat menyesuaikan nama Anda dengan `--name` yang dapat membantu Anda mengidentifikasi server.

## Skrip Instalasi Otomatis

Anda dapat memperoleh skrip instalasi otomatis Anda di `Tianji` -> `Servers` -> `Add` -> tab `Auto`

Ini akan secara otomatis mengunduh pelapor dan membuat layanan linux di mesin Anda. Jadi, ini memerlukan izin root.

### Uninstall

Jika Anda ingin mencopot layanan pelapor, Anda dapat menggunakan perintah ini seperti:
```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
```

Perubahan utama adalah menambahkan `-s uninstall` ke perintah instalasi Anda.

## Kubernetes

Jika server Anda berjalan di dalam klaster Kubernetes, Anda dapat menyebarkan pelapor sebagai DaemonSet sehingga setiap node melaporkan metrik secara otomatis. Lihat [Deploy Reporter as DaemonSet](./kubernetes/reporter-daemonset.md) untuk detailnya.

## Q&A

### Bagaimana cara memeriksa log layanan pelapor tianji?

Jika Anda menginstal dengan skrip instalasi otomatis, tianji akan membantu Anda menginstal layanan yang diberi nama `tianji-reporter` di mesin linux Anda.

Anda dapat menggunakan perintah ini untuk memeriksa log pelapor tianji:

```bash
journalctl -fu tianji-reporter.service
```

### Tidak menemukan mesin Anda di tab server meskipun laporan menunjukkan berhasil

Mungkin tianji Anda berada di belakang reverse proxy contohnya `nginx`.

Silakan pastikan reverse proxy Anda menambahkan dukungan websocket.

## Mengapa mesin saya selalu offline?

Silakan periksa tanggal dan waktu server Anda.
