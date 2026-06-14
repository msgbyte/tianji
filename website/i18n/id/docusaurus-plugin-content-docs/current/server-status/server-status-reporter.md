---
sidebar_position: 1
_i18n_hash: 479219b036abf3d6006999bf96fd2ea9
---
# Pelapor Status Server

Anda dapat melaporkan status server Anda dengan mudah menggunakan tianji reporter

Anda dapat mengunduhnya dari [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases)

## Penggunaan

```
Penggunaan tianji-reporter:
  --interval int
        Masukkan INTERVAL, dalam detik (default 5)
  --mode http
        Mode pengiriman data laporan, Anda dapat memilih: `http` atau `udp`, default adalah `http` (default "http")
  --name string
        Nama identifikasi untuk mesin ini
  --url string
        URL http dari tianji, contohnya: https://tianji.dev
  --vnstat
        Gunakan vnstat untuk statistik lalu lintas, hanya untuk linux
  --workspace string
        ID ruang kerja untuk tianji, ini harus berupa uuid
```

**url** dan **workspace** wajib diisi, artinya Anda akan melaporkan layanan Anda ke host dan ruang kerja mana.

Secara default, nama node server akan sama dengan nama host, jadi Anda dapat menyesuaikan nama Anda dengan `--name` yang dapat membantu Anda mengidentifikasi server.

## Skrip Instalasi Otomatis

Anda bisa mendapatkan skrip instalasi otomatis di `Tianji` -> `Servers` -> `Add` -> tab `Auto`

Ini akan secara otomatis mengunduh reporter dan membuat layanan linux di mesin Anda, sehingga memerlukan izin root.

### Uninstall

Jika Anda ingin menghapus layanan reporter, Anda dapat menggunakan perintah ini seperti:

```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
```

Perubahan utama adalah menambahkan `-s uninstall` ke perintah instalasi Anda.

## Kubernetes

Jika server Anda berjalan dalam cluster Kubernetes, Anda dapat menerapkan reporter sebagai DaemonSet sehingga setiap node secara otomatis melaporkan metrik. Lihat [Deploy Reporter as DaemonSet](./kubernetes/reporter-daemonset.md) untuk detailnya.

## Q&A

### Bagaimana cara memeriksa log layanan tianji reporter?

Jika Anda menginstal dengan skrip instalasi otomatis, tianji akan membantu Anda menginstal layanan yang bernama `tianji-reporter` di mesin linux Anda.

Anda dapat menggunakan perintah ini untuk memeriksa log tianji reporter:

```bash
journalctl -fu tianji-reporter.service
```

### Mengapa mesin Anda tidak ditemukan di tab server meskipun laporan menunjukkan sukses?

Mungkin tianji Anda berada di belakang reverse proxy, contohnya `nginx`.

Pastikan reverse proxy Anda menambahkan dukungan websocket

## Mengapa mesin saya selalu offline?

Silakan periksa pengaturan tanggal dan waktu server Anda.
