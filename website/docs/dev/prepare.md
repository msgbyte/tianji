---
sidebar_position: 1
---

# Prepare To Develop

## Prepare Database which using docker

```bash
docker run --name tianji-pg -e POSTGRES_DB=tianji -e POSTGRES_USER=tianji -e POSTGRES_PASSWORD=tianji -d postgres:15.4-alpine
```


## Prepare .env file

```bash
cp .env.example src/server/.env
```

config `DATABASE_URL` with `postgresql://tianji:tianji@localhost:5432/tianji?schema=public`

Like this:

```ini
DATABASE_URL="postgresql://tianji:tianji@localhost:5432/tianji?schema=public"
ALLOW_OPENAPI=true
```

## Prepare Database struct

Now you can visit database, and you can visit 

```bash
cd src/server && pnpm db:migrate:apply
```

## Default Account

Default Account is `admin`/`admin`
