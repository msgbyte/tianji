---
sidebar_position: 1
_i18n_hash: f20c701ad093f995d1aad2b2b37ae5ec
---
# Préparation au développement

## Préparer la base de données utilisant Docker

```bash
docker run --name tianji-pg -e POSTGRES_DB=tianji -e POSTGRES_USER=tianji -e POSTGRES_PASSWORD=tianji -d postgres:15.4-alpine
```

## Préparer le fichier .env

```bash
cp .env.example src/server/.env
```

Configurez `DATABASE_URL` avec `postgresql://tianji:tianji@localhost:5432/tianji?schema=public`

Comme ceci :

```ini
DATABASE_URL="postgresql://tianji:tianji@localhost:5432/tianji?schema=public"
ALLOW_OPENAPI=true
```

## Préparer la structure de la base de données

Vous pouvez maintenant accéder à la base de données, et vous pouvez visiter

```bash
cd src/server && pnpm db:migrate:apply
```

## Compte par défaut

Le compte par défaut est `admin`/`admin`
