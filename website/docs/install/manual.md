---
sidebar_position: 1
---

# Install without docker

Use docker to install `Tianji` is best way which you dont need consider about enviroment problem.

But if your server not support dockerize, you can try to install by manual.

## Requirements

You need:

- [Node.js](https://nodejs.org/en/download/) 18.12+ / 20.4+
- [pnpm](https://pnpm.io/) 8.15.3+
- [Git](https://git-scm.com/downloads)
- [postgresql](https://www.postgresql.org/)
- [pm2](https://pm2.keymetrics.io/) - For running Tianji in the background
- [apprise](https://github.com/caronc/apprise) - optional, if you need it to notify

## Clone Code and Build

```bash
git clone https://github.com/msgbyte/tianji.git
cd tianji
pnpm install

pnpm build
```

## Prepare Environment File

Create a `.env` file in `src/server`

```ini
DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/tianji?schema=public"
JWT_SECRET="replace-me-with-a-random-string"
```

Make sure your database url is correct. and dont remember create database before.

For more environment can check this document [environment](../environment.md)

> if you can, better to make sure your encoding is en_US.utf8, for example: `createdb -E UTF8 -l en_US.utf8 tianji`

## Run server

```bash
npm install pm2 -g && pm2 install pm2-logrotate

# Init db migrate
cd src/server
pnpm db:migrate:apply

# Start Server
pm2 start ./dist/src/server/main.js --name tianji
```

Default, `Tianji` will run on http://localhost:12345
