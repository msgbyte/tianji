---
sidebar_position: 1
_i18n_hash: f20c701ad093f995d1aad2b2b37ae5ec
---
# 開発の準備

## Dockerを使用したデータベースの準備

```bash
docker run --name tianji-pg -e POSTGRES_DB=tianji -e POSTGRES_USER=tianji -e POSTGRES_PASSWORD=tianji -d postgres:15.4-alpine
```

## .envファイルの準備

```bash
cp .env.example src/server/.env
```

`DATABASE_URL`を`postgresql://tianji:tianji@localhost:5432/tianji?schema=public`に設定します。

以下のようになります：

```ini
DATABASE_URL="postgresql://tianji:tianji@localhost:5432/tianji?schema=public"
ALLOW_OPENAPI=true
```

## データベース構造の準備

データベースにアクセスできるようになりました。以下のコマンドを実行してください：

```bash
cd src/server && pnpm db:migrate:apply
```

## デフォルトアカウント

デフォルトアカウントは`admin`/`admin`です。
