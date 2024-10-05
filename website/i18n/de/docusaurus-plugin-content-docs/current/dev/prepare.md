---
sidebar_position: 1
_i18n_hash: f20c701ad093f995d1aad2b2b37ae5ec
---
# Vorbereitung zur Entwicklung

## Datenbank vorbereiten, die Docker verwendet

```bash
docker run --name tianji-pg -e POSTGRES_DB=tianji -e POSTGRES_USER=tianji -e POSTGRES_PASSWORD=tianji -d postgres:15.4-alpine
```

## .env-Datei vorbereiten

```bash
cp .env.example src/server/.env
```

Konfiguriere `DATABASE_URL` mit `postgresql://tianji:tianji@localhost:5432/tianji?schema=public`

So sieht es aus:

```ini
DATABASE_URL="postgresql://tianji:tianji@localhost:5432/tianji?schema=public"
ALLOW_OPENAPI=true
```

## Datenbankstruktur vorbereiten

Jetzt kannst du auf die Datenbank zugreifen und folgendes ausführen:

```bash
cd src/server && pnpm db:migrate:apply
```

## Standardkonto

Das Standardkonto ist `admin`/`admin`
