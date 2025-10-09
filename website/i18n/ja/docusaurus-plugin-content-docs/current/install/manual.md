---
sidebar_position: 1
_i18n_hash: 94d2e9b28e14ee0258d96bc450acf5f6
---
# Dockerを使用せずにインストール

`Tianji`をインストールするにはDockerを使用するのが最適な方法ですが、環境問題を考慮する必要はありません。

しかし、サーバーがDockerをサポートしていない場合は、手動でインストールを試みることができます。

## 必要条件

以下が必要です:

- [Node.js](https://nodejs.org/en/download/) 18.12+ / 20.4+
- [pnpm](https://pnpm.io/) 9.x（9.7.1が望ましい）
- [Git](https://git-scm.com/downloads)
- [postgresql](https://www.postgresql.org/)
- [pm2](https://pm2.keymetrics.io/) - Tianjiをバックグラウンドで実行するため
- [apprise](https://github.com/caronc/apprise) - 通知が必要な場合はオプション

## コードをクローンしてビルド

```bash
git clone https://github.com/msgbyte/tianji.git
cd tianji
pnpm install

pnpm build
```

## 環境ファイルの準備

`src/server`に`.env`ファイルを作成

```ini
DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/tianji?schema=public"
JWT_SECRET="replace-me-with-a-random-string"
```

データベースのURLが正しいことを確認してください。また、データベースを事前に作成することを忘れないでください。

より詳細な環境に関しては、このドキュメントを確認してください [environment](./environment.md)

> 可能であれば、エンコーディングがen_US.utf8であることを確認するのが望ましいです。例えば: `createdb -E UTF8 -l en_US.utf8 tianji`

## サーバーを実行

```bash
npm install pm2 -g && pm2 install pm2-logrotate

# データベースの移行を初期化
cd src/server
pnpm db:migrate:apply

# サーバーを起動
pm2 start ./dist/src/server/main.js --name tianji
```

デフォルトでは、`Tianji`は`http://localhost:12345`で実行されます。

## 新しいバージョンへのコードの更新

```bash
# 新しいリリース/タグをチェックアウト
cd tianji
git fetch --tags
git checkout -q <version>

# 依存関係を更新
pnpm install

# プロジェクトをビルド
pnpm build

# データベースの移行を実行
cd src/server
pnpm db:migrate:apply

# サーバーを再起動
pm2 restart tianji
```

# よくある質問

## `isolated-vm`のインストールが失敗する

Python 3.12を使用している場合、以下のようなエラーが報告されます:

```
ModuleNotFoundError: No module named 'distutils'
```

これは、Python 3.12から`distutils`がビルトインモジュールから削除されたためです。現在、解決策があります。

Pythonのバージョンを3.12から3.9に切り替えることで解決できます。

### brew管理のPythonでの解決方法

```bash
brew install python@3.9
rm /opt/homebrew/bin/python3
ln -sf /opt/homebrew/bin/python3 /opt/homebrew/bin/python3.9
```

その後、`python3 --version`でバージョンを確認できます。
