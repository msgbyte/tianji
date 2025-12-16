---
sidebar_position: 1
_i18n_hash: f20c701ad093f995d1aad2b2b37ae5ec
---
# Prepararse para desarrollar

## Preparar la base de datos usando Docker

```bash
docker run --name tianji-pg -e POSTGRES_DB=tianji -e POSTGRES_USER=tianji -e POSTGRES_PASSWORD=tianji -d postgres:15.4-alpine
```

## Preparar el archivo .env

```bash
cp .env.example src/server/.env
```

Configurar `DATABASE_URL` con `postgresql://tianji:tianji@localhost:5432/tianji?schema=public`

Así:

```ini
DATABASE_URL="postgresql://tianji:tianji@localhost:5432/tianji?schema=public"
ALLOW_OPENAPI=true
```

## Preparar la estructura de la base de datos

Ahora puedes acceder a la base de datos y ejecutar:

```bash
cd src/server && pnpm db:migrate:apply
```

## Cuenta predeterminada

La cuenta predeterminada es `admin`/`admin`
