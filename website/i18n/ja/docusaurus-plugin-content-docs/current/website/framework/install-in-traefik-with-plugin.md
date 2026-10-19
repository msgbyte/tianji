---
sidebar_position: 2
_i18n_hash: f85f95f54fdfadadf81712ccb1401e46
---
# Traefikへのプラグインのインストール

Tianjiは、TraefikプロキシにTianjiのウェブサイト分析機能を簡単に統合できるTraefikプラグインを提供します。

## プラグイン概要

[traefik-tianji-plugin](https://github.com/msgbyte/traefik-tianji-plugin) は、Tianji専用に開発されたTraefikミドルウェアプラグインで、ウェブサイトコードを変更することなくTianjiのトラッキングスクリプトを自動的にウェブサイトに挿入して、訪問者データの収集を開始できます。

## プラグインのインストール

### 1. 静的設定にプラグインを追加

まず、Traefikの静的設定にプラグイン参照を追加する必要があります。プラグインバージョン番号はGitタグを参照します。

#### YAML設定

`traefik.yml`または静的設定ファイルに以下を追加します：

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

`config.yml`または動的設定ファイルに：

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
  - 公式ホストサービスを使用する場合: `https://app.tianji.dev`

- **websiteId**: Tianjiで作成されたウェブサイトのID
  - Tianji管理パネルのウェブサイト設定で確認できます

### オプションパラメータ

プラグインは他の設定パラメータをサポートしており、動作をカスタマイズできます。特定のパラメータについては、[GitHubリポジトリのドキュメント](https://github.com/msgbyte/traefik-tianji-plugin)を参照してください。

## ミドルウェアの使用

設定後、ルーターでこのミドルウェアを使用する必要があります：

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

1. リクエストがTraefikプロキシを通過するとき、プラグインがレスポンス内容をチェックします
2. レスポンスがHTMLコンテンツの場合、プラグインが自動的にTianjiトラッキングスクリプトを注入します
3. スクリプトは訪問者データの収集を開始し、ページが読み込まれたときにTianjiサーバーに送信します

## 重要な注意事項

- クライアントブラウザからTianjiサーバーアドレスにアクセスできることを確認してください
- ウェブサイトIDが有効でなければ、データを正しく収集できません
- プラグインはレスポンス内容のタイプがHTMLの場合にのみ効果を発揮します
- 最適なパフォーマンスと機能のために、最新バージョンのプラグインを使用することをお勧めします

## 参考

- [プラグインのソースコード](https://github.com/msgbyte/traefik-tianji-plugin)
- [Traefikプラグインのドキュメント](https://doc.traefik.io/traefik/plugins/)
