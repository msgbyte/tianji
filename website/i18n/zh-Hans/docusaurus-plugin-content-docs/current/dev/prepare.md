---
sidebar_position: 1
_i18n_hash: f20c701ad093f995d1aad2b2b37ae5ec
---
# 准备开发

## 准备使用 Docker 的数据库

```bash
docker run --name tianji-pg -e POSTGRES_DB=tianji -e POSTGRES_USER=tianji -e POSTGRES_PASSWORD=tianji -d postgres:15.4-alpine
```

## 准备 .env 文件

```bash
cp .env.example src/server/.env
```

将 `DATABASE_URL` 配置为 `postgresql://tianji:tianji@localhost:5432/tianji?schema=public`

如下所示：

```ini
DATABASE_URL="postgresql://tianji:tianji@localhost:5432/tianji?schema=public"
ALLOW_OPENAPI=true
```

## 准备数据库结构

现在你可以访问数据库，并可以访问

```bash
cd src/server && pnpm db:migrate:apply
```

## 默认账户

默认账户为 `admin`/`admin`
