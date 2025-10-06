---
sidebar_position: 100
_i18n_hash: 2419750faca3b35056a24bc0a5e02a22
---
# Pemecahan Masalah

Dokumen ini mengumpulkan masalah umum dan solusinya yang mungkin Anda temui saat menggunakan Tianji.

## Masalah Koneksi WebSocket

### Deskripsi Masalah

Saat menggunakan layanan HTTPS, fungsi lain bekerja normal, namun layanan WebSocket tidak dapat tersambung dengan benar, yang ditandai dengan:

- Indikator status koneksi di sudut kiri bawah berwarna abu-abu
- Daftar halaman server menunjukkan jumlah tetapi tidak ada konten sebenarnya

### Penyebab Utama

Masalah ini biasanya disebabkan oleh kebijakan penerusan WebSocket yang tidak tepat dalam perangkat lunak proxy terbalik. Di lingkungan HTTPS, koneksi WebSocket memerlukan kebijakan keamanan Cookie yang benar.

### Solusi

Anda dapat menyelesaikan masalah ini dengan menetapkan variabel lingkungan berikut:

```bash
AUTH_USE_SECURE_COOKIES=true
```

Pengaturan ini memaksa aplikasi untuk menganggap cookie yang diteruskan oleh browser sebagai cookie terenkripsi, sehingga menyelesaikan masalah koneksi WebSocket.

#### Metode Konfigurasi

**Lingkungan Docker:**
```yaml
# docker-compose.yml
services:
  tianji:
    environment:
      - AUTH_USE_SECURE_COOKIES=true
```

**Penerapan Langsung:**
```bash
export AUTH_USE_SECURE_COOKIES=true
```

### Langkah-Langkah Verifikasi

Setelah konfigurasi, restart layanan dan periksa:

1. Indikator status koneksi di sudut kiri bawah harus berwarna hijau
2. Halaman server harus menampilkan data waktu nyata secara normal
3. Koneksi WebSocket harus terjalin dengan baik di alat pengembang browser

---

*Jika Anda menemui masalah lain, jangan ragu untuk mengirimkan [Issue](https://github.com/msgbyte/tianji/issues) atau berkontribusi solusi ke dokumentasi ini.*
