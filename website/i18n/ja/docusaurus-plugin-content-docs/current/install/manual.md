---
sidebar_position: 1
_i18n_hash: bd680ba831a70a5f00ce7db124d136dc
---
# Dockerを使わずにインストール

`Tianji`をインストールする際にdockerを使うのが環境問題を考慮しなくて良いため最善の方法です。

しかし、サーバーがdockerをサポートしていない場合は、手動でインストールを試みることができます。

## 要件

以下が必要です:

- [Node.js](https://nodejs.org/en/download/) 18.12+ / 20.4+
- [pnpm](https://pnpm.io/) 9.x(できれば9.7.1)
- [Git](https://git-scm.com/downloads)
- [postgresql](https://www.postgresql.org/)
- [pm2](https://pm2.keymetrics.io/) - Tianjiをバックグラウンドで実行するため
- [apprise](https://github.com/caronc/apprise) - オプション、通知が必要な場合

## コードをクローンしてビルド

```bash
git clone https://github.com/msgbyte/tianji.git
cd tianji
pnpm install

pnpm build
```

## 環境ファイルの準備

`src/server`に`.env`ファイルを作成します

```ini
DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/tianji?schema=public"
JWT_SECRET="replace-me-with-a-random-string"
```

データベースURLが正しいことを確認してください。また、データベースを事前に作成することを忘れないようにしてください。

詳細な環境設定についてはこのドキュメントを確認してください [environment](./environment.md)

> 可能であれば、エンコーディングをen_US.utf8に設定してください。例えば: `createdb -E UTF8 -l en_US.utf8 tianji`

## サーバーの実行

```bash
npm install pm2 -g && pm2 install pm2-logrotate

# データベースマイグレーションの初期化
cd src/server
pnpm db:migrate:apply

# サーバーを開始
pm2 start ./dist/src/server/main.js --name tianji
```

デフォルトでは、`Tianji`は`http://localhost:12345`で実行されます。

## 新しいバージョンへのコードの更新

```bash
# 新しいリリース/タグにチェックアウト
cd tianji
git fetch --tags
git checkout -q <version>

# 依存関係の更新
pnpm install

# プロジェクトをビルド
pnpm build

# データベースマイグレーションの実行
cd src/server
pnpm db:migrate:apply

# サーバーを再起動
pm2 restart tianji
```

# よくある質問

## `isolated-vm`のインストールに失敗

Python 3.12を使用している場合、次のようなエラーが報告されることがあります:

```
ModuleNotFoundError: No module named 'distutils'
```

これはPython 3.12がビルトインモジュールから`distutils`を削除したためです。現在、この問題の解決策が用意されています。

Pythonのバージョンを3.12から3.9に変更することで解決できます。

### brewで管理されたPythonでの解決方法

```bash
brew install python@3.9
rm /opt/homebrew/bin/python3
ln -sf /opt/homebrew/bin/python3 /opt/homebrew/bin/python3.9
```

その後、`python3 --version`でバージョンを確認できます。
