---
sidebar_position: 1
_i18n_hash: bd680ba831a70a5f00ce7db124d136dc
---
# Instalasi tanpa Docker

Menggunakan Docker untuk menginstal `Tianji` adalah cara terbaik karena Anda tidak perlu mempertimbangkan masalah lingkungan.

Namun, jika server Anda tidak mendukung Docker, Anda dapat mencoba menginstalnya secara manual.

## Persyaratan

Anda membutuhkan:

- [Node.js](https://nodejs.org/en/download/) 18.12+ / 20.4+
- [pnpm](https://pnpm.io/) 9.x (lebih baik 9.7.1)
- [Git](https://git-scm.com/downloads)
- [postgresql](https://www.postgresql.org/)
- [pm2](https://pm2.keymetrics.io/) - Untuk menjalankan Tianji di latar belakang
- [apprise](https://github.com/caronc/apprise) - opsional, jika Anda membutuhkannya untuk pemberitahuan

## Kloning Kode dan Bangun

```bash
git clone https://github.com/msgbyte/tianji.git
cd tianji
pnpm install

pnpm build
```

## Siapkan File Lingkungan

Buat file `.env` di `src/server`

```ini
DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/tianji?schema=public"
JWT_SECRET="ganti-dengan-string-acak"
```

Pastikan URL database Anda benar. dan jangan lupa buat database sebelumnya.

Untuk lebih banyak pengaturan lingkungan bisa cek dokumen ini [environment](./environment.md)

> jika Anda bisa, lebih baik pastikan encoding Anda adalah en_US.utf8, misalnya: `createdb -E UTF8 -l en_US.utf8 tianji`

## Jalankan Server

```bash
npm install pm2 -g && pm2 install pm2-logrotate

# Inisialisasi migrasi db
cd src/server
pnpm db:migrate:apply

# Mulai Server
pm2 start ./dist/src/server/main.js --name tianji
```

Secara default, `Tianji` akan berjalan di `http://localhost:12345`

## Perbarui Kode ke Versi Baru

```bash
# Checkout rilis/tag baru
cd tianji
git fetch --tags
git checkout -q <version>

# Perbarui dependensi
pnpm install

# Bangun proyek
pnpm build

# Jalankan migrasi db
cd src/server
pnpm db:migrate:apply

# Restart Server
pm2 restart tianji
```

# Pertanyaan yang Sering Diajukan

## Instalasi `isolated-vm` gagal

Jika Anda menggunakan python 3.12, akan muncul kesalahan seperti ini:

```
ModuleNotFoundError: No module named 'distutils'
```

Ini karena python 3.12 menghapus `distutils` dari modul bawaan. sekarang kita memiliki solusi yang baik tentang ini.

Anda bisa mengganti versi python Anda dari 3.12 ke 3.9 untuk mengatasinya.

### Cara mengatasinya di python yang dikendalikan oleh brew

```bash
brew install python@3.9
rm /opt/homebrew/bin/python3
ln -sf /opt/homebrew/bin/python3 /opt/homebrew/bin/python3.9
```

kemudian Anda bisa mengecek versinya dengan `python3 --version`
