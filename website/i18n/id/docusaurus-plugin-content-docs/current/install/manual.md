---
sidebar_position: 1
_i18n_hash: 94d2e9b28e14ee0258d96bc450acf5f6
---
# Instalasi tanpa Docker

Menggunakan Docker untuk memasang `Tianji` adalah cara terbaik karena Anda tidak perlu mempertimbangkan masalah lingkungan.

Tetapi jika server Anda tidak mendukung Docker, Anda dapat mencoba menginstal secara manual.

## Persyaratan

Anda membutuhkan:

- [Node.js](https://nodejs.org/en/download/) 18.12+ / 20.4+
- [pnpm](https://pnpm.io/) 10.x (10.17.1 lebih baik)
- [Git](https://git-scm.com/downloads)
- [PostgreSQL](https://www.postgresql.org/)
- [pm2](https://pm2.keymetrics.io/) - Untuk menjalankan Tianji di latar belakang
- [apprise](https://github.com/caronc/apprise) - opsional, jika Anda membutuhkannya untuk notifikasi

## Mengkloning Kode dan Membangun

```bash
git clone https://github.com/msgbyte/tianji.git
cd tianji
pnpm install

pnpm build
```

## Persiapkan File Lingkungan

Buat file `.env` di `src/server`

```ini
DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/tianji?schema=public"
JWT_SECRET="ganti-dengan-string-acak"
```

Pastikan URL database Anda benar. dan jangan lupa membuat database sebelumnya.

Untuk lebih banyak lingkungan, Anda bisa melihat dokumen ini [environment](./environment.md)

> Jika bisa, lebih baik pastikan encoding Anda adalah en_US.utf8, misalnya: `createdb -E UTF8 -l en_US.utf8 tianji`

## Menjalankan Server

```bash
npm install pm2 -g && pm2 install pm2-logrotate

# Inisialisasi migrasi db
cd src/server
pnpm db:migrate:apply

# Memulai Server
pm2 start ./dist/src/server/main.js --name tianji
```

Secara default, `Tianji` akan berjalan di `http://localhost:12345`

## Memperbarui Kode ke Versi Baru

```bash
# Checkout rilis/tag baru
cd tianji
git fetch --tags
git checkout -q <versi>

# Memperbarui dependensi
pnpm install

# Membangun proyek
pnpm build

# Jalankan migrasi db
cd src/server
pnpm db:migrate:apply

# Mulai ulang Server
pm2 restart tianji
```

# Pertanyaan yang Sering Diajukan

## Gagal Menginstal `isolated-vm`

Jika Anda menggunakan Python 3.12, akan muncul kesalahan seperti ini:

```
ModuleNotFoundError: No module named 'distutils'
```

Hal ini karena Python 3.12 menghapus `distutils` dari modul bawaan. Sekarang kami memiliki resolusi yang baik tentang itu.

Anda dapat mengganti versi Python Anda dari 3.12 ke 3.9 untuk menyelesaikannya.

### Cara menyelesaikannya di Python yang dikontrol oleh brew

```bash
brew install python@3.9
rm /opt/homebrew/bin/python3
ln -sf /opt/homebrew/bin/python3 /opt/homebrew/bin/python3.9
```

kemudian Anda dapat memeriksa versi dengan `python3 --version`
