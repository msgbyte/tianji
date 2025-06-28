---
sidebar_position: 2
_i18n_hash: 8142a07cc46361e9e72d8c883ab7869a
---
# プラグインを使用してTraefikにインストール

Tianjiは、TraefikプロキシにTianjiのウェブサイト分析機能を簡単に統合できるTraefikプラグインを提供します。

## プラグイン概要

[traefik-tianji-plugin](https://github.com/msgbyte/traefik-tianji-plugin)は、Tianji用に特別に開発されたTraefikミドルウェアプラグインで、ウェブサイトのコードを変更することなく、Tianjiトラッキングスクリプトを自動的にウェブサイトに挿入して訪問者データの収集を開始できます。

## プラグインのインストール

### 1. 静的設定にプラグインを追加

まず、Traefikの静的設定にプラグイン参照を追加する必要があります。プラグインのバージョン番号はgitタグを参照します。

#### YAML設定

`traefik.yml`または静的設定ファイルに以下を追加:

```yaml
experimental:
  plugins:
    traefik-tianji-plugin:
      moduleName: "github.com/msgbyte/traefik-tianji-plugin"
      version: "v0.2.1"
```

#### TOML設定

```toml
[experimental.plugins.traefik-tianji-plugin]
  moduleName = "github.com/msgbyte/traefik-tianji-plugin"
  version = "v0.2.1"
```

#### コマンドライン

```bash
--experimental.plugins.traefik-tianji-plugin.modulename=github.com/msgbyte/traefik-tianji-plugin
--experimental.plugins.traefik-tianji-plugin.version=v0.2.1
```

### 2. ミドルウェアの設定

プラグインをインストールした後、動的設定でミドルウェアを設定する必要があります。

#### YAML動的設定

`config.yml`または動的設定ファイルに以下を追加:

```yaml
http:
  middlewares:
    my-tianji-middleware:
      plugin:
        traefik-tianji-plugin:
          tianjiHost: "https://tianji.your-domain.com"
          websiteId: "your-website-id"
```

#### TOML動的設定

```toml
[http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin]
  tianjiHost = "https://tianji.your-domain.com"
  websiteId = "your-website-id"
```

#### Docker Composeラベル

```yaml
version: '3.7'
services:
  my-app:
    image: nginx:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.my-app.rule=Host(`my-app.local`)"
      - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.tianjiHost=https://tianji.your-domain.com"
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.websiteId=your-website-id"
```

## 設定パラメータ

### 必須パラメータ

- **tianjiHost**: Tianjiサーバーの完全なURL
  - 例: `https://tianji.your-domain.com`
  - 公式ホスティングサービスを使用する場合: `https://app-tianji.msgbyte.com`

- **websiteId**: Tianjiで作成されたウェブサイトID
  - Tianji管理パネルのウェブサイト設定で見つけることができます

### オプションパラメータ

プラグインは他の設定パラメータもサポートしており、動作をカスタマイズできます。具体的なパラメータについては、[GitHubリポジトリのドキュメント](https://github.com/msgbyte/traefik-tianji-plugin)を参照してください。

## ミドルウェアの使用

設定後、ルーターでこのミドルウェアを使用する必要があります。

### YAML設定

```yaml
http:
  routers:
    my-app:
      rule: "Host(`my-app.local`)"
      middlewares:
        - "my-tianji-middleware"
      service: "my-app-service"
```

### Docker Composeラベル

```yaml
labels:
  - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
```

## 動作の仕組み

1. リクエストがTraefikプロキシを通過するとき、プラグインはレスポンスの内容を確認します
2. レスポンスがHTMLコンテンツである場合、プラグインは自動的にTianjiトラッキングスクリプトを挿入します
3. スクリプトは訪問者データの収集を開始し、ページが読み込まれたときにTianjiサーバーに送信します

## 重要な注意事項

- Tianjiサーバーのアドレスがクライアントブラウザからアクセス可能であることを確認してください
- ウェブサイトIDが有効でなければ、データが正しく収集されません
- プラグインはレスポンスコンテンツタイプがHTMLの場合にのみ有効です
- 最適なパフォーマンスと機能のために、最新バージョンのプラグインを使用することを推奨します

## 参照

- [プラグインソースコード](https://github.com/msgbyte/traefik-tianji-plugin)
- [Traefikプラグインドキュメント](https://doc.traefik.io/traefik/plugins/)
