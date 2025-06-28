---
sidebar_position: 2
_i18n_hash: 8142a07cc46361e9e72d8c883ab7869a
---
# Traefikでプラグインをインストール

Tianjiは、TraefikプロキシにTianjiウェブサイト分析機能を簡単に統合するためのTraefikプラグインを提供しています。

## プラグイン概要

[traefik-tianji-plugin](https://github.com/msgbyte/traefik-tianji-plugin)は、Tianji用に特別に開発されたTraefikのミドルウェアプラグインで、ウェブサイトのコードを変更せずにTianjiのトラッキングスクリプトを自動的に注入し、訪問者データの収集を開始できます。

## プラグインのインストール

### 1. 静的設定にプラグインを追加

まず、Traefikの静的設定にプラグインの参照を追加します。プラグインのバージョン番号はGitタグを参照します。

#### YAML設定

`traefik.yml`または静的設定ファイルに以下を追加します:

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

プラグインをインストールした後、動的設定でミドルウェアを構成する必要があります。

#### YAML動的設定

`config.yml`または動的設定ファイルに以下を追加します:

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
  - 公式ホストサービスを使用している場合: `https://app-tianji.msgbyte.com`

- **websiteId**: Tianjiで作成されたウェブサイトID
  - Tianjiの管理パネルのウェブサイト設定で確認可能

### 任意パラメータ

プラグインは、動作をカスタマイズするためのその他の設定パラメータもサポートしています。特定のパラメータについては、[GitHubリポジトリのドキュメント](https://github.com/msgbyte/traefik-tianji-plugin)を参照してください。

## ミドルウェアの使用

設定後、このミドルウェアをルーターで使用する必要があります:

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

## 動作原理

1. リクエストがTraefikプロキシを通過すると、プラグインはレスポンスコンテンツをチェックします。
2. レスポンスがHTMLコンテンツの場合、プラグインは自動的にTianjiトラッキングスクリプトを注入します。
3. スクリプトはページがロードされると訪問者データの収集を開始し、Tianjiサーバーに送信します。

## 重要な注意事項

- Tianjiサーバーのアドレスがクライアントブラウザからアクセス可能であることを確認してください。
- ウェブサイトIDが有効でないと、データを適切に収集できません。
- プラグインはレスポンスコンテンツタイプがHTMLの場合にのみ効果を発揮します。
- 最適な性能と機能のために、最新バージョンのプラグインを使用することをお勧めします。

## 参考

- [プラグインソースコード](https://github.com/msgbyte/traefik-tianji-plugin)
- [Traefikプラグインドキュメント](https://doc.traefik.io/traefik/plugins/)
