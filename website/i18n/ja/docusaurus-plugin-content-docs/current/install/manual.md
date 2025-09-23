---
sidebar_position: 1
_i18n_hash: 7b72ca055d015393e7ca37eb45f7a74b
---
# 非Docker環境でのインストール

Dockerを使用して`Tianji`をインストールするのが最善の方法で、環境問題を考慮する必要がありません。

しかし、サーバーがDockerをサポートしていない場合は、手動でインストールすることができます。

## 要件

以下が必要です：

- [Node.js](https://nodejs.org/en/download/) 18.12+ / 20.4+
- [pnpm](https://pnpm.io/) 9.x（9.7.1が望ましい）
- [Git](https://git-scm.com/downloads)
- [postgresql](https://www.postgresql.org/)
- [pm2](https://pm2.keymetrics.io/) - Tianjiをバックグラウンドで実行するため
- [apprise](https://github.com/caronc/apprise) - オプション、通知が必要な場合

## コードのクローンとビルド

```bash
git clone https://github.com/msgbyte/tianji.git
cd tianji
pnpm install

pnpm build
```

## 環境ファイルの準備

`src/server`に`.env`ファイルを作成します。

```ini
DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/tianji?schema=public"
JWT_SECRET="replace-me-with-a-random-string"
```

データベースのURLが正しいことを確認し、データベースを事前に作成することを忘れないでください。

詳細な環境設定については、このドキュメントを参照してください [environment](./environment.md)

> 可能であれば、エンコーディングがen_US.utf8であることを確認してください。例：`createdb -E UTF8 -l en_US.utf8 tianji`

## サーバーの実行

```bash
npm install pm2 -g && pm2 install pm2-logrotate

# データベースのマイグレーションを初期化
cd src/server
pnpm db:migrate:apply

# サーバーの起動
pm2 start ./dist/src/server/main.js --name tianji
```

デフォルトでは、`Tianji`は`http://localhost:12345`で実行されます。

## 新しいバージョンへのコードの更新

```bash
# 新しいリリース/タグをチェックアウト
cd tianji
git fetch --tags
git checkout -q <version>

# 依存関係の更新
pnpm install

# プロジェクトのビルド
pnpm build

# データベースのマイグレーションを実行
cd src/server
pnpm db:migrate:apply

# サーバーの再起動
pm2 restart tianji
```

# よくある質問

## `isolated-vm`のインストールに失敗する

Python 3.12を使用している場合、以下のようなエラーが発生することがあります：

```
ModuleNotFoundError: No module named 'distutils'
```

これは、Python 3.12が`distutils`を組み込みモジュールから削除したためです。現在、この問題に対する良い解決策があります。

Pythonのバージョンを3.12から3.9に切り替えることで解決できます。

### brewで管理されているPythonでの解決方法

```bash
brew install python@3.9
rm /opt/homebrew/bin/python3
ln -sf /opt/homebrew/bin/python3 /opt/homebrew/bin/python3.9
```

その後、`python3 --version`でバージョンを確認できます。
