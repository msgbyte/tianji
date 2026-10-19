---
sidebar_position: 1
_i18n_hash: 3bea21234680fc0342392f5d9887ba15
---
# Integrasi dengan Keterampilan Agen

## Pengantar

**Keterampilan Kuery Data Tianji** adalah paket keterampilan ringan, yang tidak tergantung agen, yang memungkinkan agen AI (Cursor, Claude Code, Codex, Copilot CLI, dll.) untuk mengkuery platform Tianji secara langsung melalui OpenAPI yang hanya dapat dibaca.

Ini mengikuti spesifikasi [agentskills.io](https://agentskills.io/specification) — sebuah `SKILL.md` tunggal ditambah file referensi. Tidak ada proses yang berjalan lama, tidak ada runtime tambahan.

:::tip Mulai
Lihat [Panduan Instalasi](./installation.md) untuk pengaturan satu klik dan manual.
:::

**Apa yang dicakupnya:** 69 endpoint GET di 14 domain layanan:

- **Website** — statistik lalu lintas, tampilan halaman, distribusi geo, laporan Lighthouse
- **Monitor** — status uptime, data cek terbaru, peristiwa monitor
- **Survey** — tanggapan survei, statistik hasil, kategori AI
- **Telemetry** — hitungan peristiwa kustom, tampilan halaman telemetry, metrik
- **Feed** — saluran, aliran peristiwa, status feed
- **Application** — ulasan toko aplikasi, info aplikasi, statistik peristiwa
- **Billing / AI Gateway / Worker / Page / Workspace / Global / AuditLog**

## Keterampilan vs Server MCP

Tianji menawarkan dua cara untuk berintegrasi dengan agen AI. Pilih yang sesuai dengan alur kerja Anda:

| | Keterampilan Agen | [Server MCP](/docs/mcp) |
|--|--|--|
| **Bentuk** | File dokumentasi biasa (`SKILL.md` + referensi) | Proses Node.js yang berjalan lama |
| **Runtime** | Tidak ada — agen menggunakan `curl` atau alat HTTP bawaan | `npx tianji-mcp-server` |
| **Liputan** | 69 endpoint GET (hanya baca, permukaan penuh) | Subset alat yang disusun (baca + beberapa tulis) |
| **Pengaturan** | Letakkan file ke direktori keterampilan agen | Tambahkan konfigurasi MCP ke file konfigurasi agen |
| **Terbaik untuk** | Cursor / Claude Code / Codex / agen apa pun yang mengikuti spesifikasi agentskills.io | Agen dengan dukungan MCP kelas satu |

Anda dapat menggunakan keduanya secara bersamaan tanpa konflik.

## Contoh Penggunaan

Setelah diinstal, Anda dapat mengajukan pertanyaan bahasa alami kepada agen AI Anda dan agen akan memilih endpoint yang tepat:

### Contoh 1: Ikhtisar trafik situs web

```
Pengguna: Tampilkan tampilan halaman situs utama saya selama 7 hari terakhir.

Agen: [Memanggil GET /open/workspace/{workspaceId}/website/all untuk menemukan situs]
       [Kemudian GET /open/workspace/{workspaceId}/website/{websiteId}/pageviews
        dengan startAt/endAt yang mencakup 7 hari]
       Situs utama Anda menerima 12,438 tampilan halaman selama 7 hari terakhir,
       dengan puncak 2,103 pada hari Selasa. Pengarah teratas: google.com (43%).
```

### Contoh 2: Pemeriksaan kesehatan monitor

```
Pengguna: Apakah ada monitor saya yang down sekarang?

Agen: [Memanggil GET /open/workspace/{workspaceId}/monitor/all]
       [Kemudian GET /open/workspace/{workspaceId}/monitor/{monitorId}/status untuk setiap monitor]
       2 monitor saat ini DOWN:
       - api.example.com (HTTP 503, terakhir UP 12 menit lalu)
       - db-replica (timeout TCP, terakhir UP 1 jam lalu)
       8 monitor lainnya sehat.
```

### Contoh 3: Analisis hasil survei

```
Pengguna: Ringkasan tanggapan untuk survei "Umpan Balik Pelanggan Q4".

Agen: [Memanggil GET /open/workspace/{workspaceId}/survey/all untuk menyelesaikan ID]
       [Kemudian GET /open/workspace/{workspaceId}/survey/{surveyId}/stats]
       [Kemudian GET /open/workspace/{workspaceId}/survey/{surveyId}/result/list
        dengan kursor pagination]
       "Umpan Balik Pelanggan Q4" menerima 218 tanggapan. Kepuasan rata-rata
       4.3/5. Tema teratas: kinerja dasbor (disebutkan 47 kali). Fitur paling
       diminta: mode gelap (31 kali).
```

## Penanganan Data Sensitif

Beberapa endpoint dapat mengembalikan rahasia yang disimpan di platform (mis. `modelApiKey`, `customModelBaseUrl` dalam respons AI Gateway) atau PII (anggota workspace, log audit, penagihan).

Keterampilan ini menginstruksikan agen untuk:

- **Tidak pernah menampilkan** `apiKey`, `modelApiKey`, `secret`, `token`, `password`, atau bidang `credential`.
- **Merahasiakan atau menghilangkan** bidang ini saat merangkum tanggapan.
- Untuk anggota workspace / log audit, hanya mengemukakan metadata yang tidak sensitif (nama, peran, stempel waktu) kecuali pengguna secara eksplisit meminta detail lengkap.

`openapi-readonly.json` yang dibundel juga telah merahasiakan bidang ini di tingkat skema, sehingga agen tidak dapat secara tidak sengaja mengandalkan strukturnya.

## Sumber

Sumber keterampilan ini berada di repositori Tianji di bawah [`skills/tianji-data-query/`](https://github.com/msgbyte/tianji/tree/master/skills/tianji-data-query). Pull request diterima.
