---
sidebar_position: 1
---

# Install without docker

Use docker to install `Tianji` is best way which you dont need consider about enviroment problem.

But if your server not support dockerize, you can try to install by manual.

## Requirements

You need:

- [Node.js](https://nodejs.org/en/download/) 18.12+ / 20.4+
- [pnpm](https://pnpm.io/) 10.x(10.17.1 better)
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

For more environment can check this document [environment](./environment.md)

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

Default, `Tianji` will run on `http://localhost:12345`

## Update Code to new Version

```bash
# Checkout new release/tags
cd tianji
git fetch --tags
git checkout -q <version>

# Update dependencies
pnpm install

# Build project
pnpm build

# Run db migrations
cd src/server
pnpm db:migrate:apply

# Restart Server
pm2 restart tianji
```

# Frequently Asked Questions

## Install `isolated-vm` failed

If you are using python 3.12, its will report error like this:

```
ModuleNotFoundError: No module named 'distutils'
```

Its because of python 3.12 remove `distutils` from builtin module. now we have good resolution about it.

You can switch your python version from 3.12 to 3.9 can resolve it.

### How to resolve it in brew controlled python

```bash
brew install python@3.9
rm /opt/homebrew/bin/python3
ln -sf /opt/homebrew/bin/python3 /opt/homebrew/bin/python3.9
```

then you can check version with `python3 --version`
