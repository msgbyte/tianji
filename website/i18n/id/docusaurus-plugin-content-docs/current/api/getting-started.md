---
sidebar_position: 1
_i18n_hash: 2a8dfc997c42846304cde1b51f4d6145
---
# API Memulai

Tianji menyediakan REST API lengkap yang memungkinkan Anda mengakses dan mengoperasikan semua fitur Tianji secara programatis. Panduan ini akan membantu Anda memulai dengan cepat menggunakan API Tianji.

## Gambaran Umum

API Tianji didasarkan pada arsitektur REST dan menggunakan format JSON untuk pertukaran data. Semua permintaan API harus dilakukan melalui HTTPS dan memerlukan autentikasi yang tepat.

### URL Dasar API

```bash
https://your-tianji-domain.com/open
```

### Fitur yang Didukung

Melalui API Tianji, Anda dapat:

- Mengelola data analitik situs web
- Membuat dan mengelola proyek pemantauan
- Mendapatkan informasi status server
- Mengelola survei
- Mengoperasikan data telemetri
- Membuat dan mengelola ruang kerja

## Memulai Cepat

### 1. Dapatkan Kunci API

Sebelum menggunakan API, Anda perlu mendapatkan kunci API:

1. Masuk ke instansi Tianji Anda
2. Klik avatar Anda di pojok kanan atas
4. Temukan bagian **API Keys**
5. Klik tombol + untuk membuat kunci API baru
6. Beri nama kunci API Anda dan simpan

### 2. Aktifkan OpenAPI

Pastikan instansi Tianji Anda memiliki akses OpenAPI yang diaktifkan:

Atur dalam variabel lingkungan Anda:
```bash
ALLOW_OPENAPI=true
```

### 3. Panggilan API Pertama

Uji koneksi API Anda menggunakan curl:

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json"
```

## Langkah Selanjutnya

- Periksa [Dokumentasi Autentikasi](./authentication.md) untuk metode autentikasi yang lebih rinci
- Jelajahi [Dokumentasi Referensi API](/api) untuk melihat semua endpoint yang tersedia
- Gunakan [OpenAPI SDK](./openapi-sdk.md) untuk panggilan API yang aman tipe
