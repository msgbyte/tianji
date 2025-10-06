---
sidebar_position: 1
_i18n_hash: f20c701ad093f995d1aad2b2b37ae5ec
---
# Persiapan untuk Pengembangan

## Persiapkan Database yang menggunakan docker

```bash
docker run --name tianji-pg -e POSTGRES_DB=tianji -e POSTGRES_USER=tianji -e POSTGRES_PASSWORD=tianji -d postgres:15.4-alpine
```

## Persiapkan file .env

```bash
cp .env.example src/server/.env
```

konfigurasikan `DATABASE_URL` dengan `postgresql://tianji:tianji@localhost:5432/tianji?schema=public`

Seperti ini:

```ini
DATABASE_URL="postgresql://tianji:tianji@localhost:5432/tianji?schema=public"
ALLOW_OPENAPI=true
```

## Persiapkan Struktur Database

Sekarang Anda dapat mengakses database, dan Anda dapat mengunjungi

```bash
cd src/server && pnpm db:migrate:apply
```

## Akun Default

Akun Default adalah `admin`/`admin`
