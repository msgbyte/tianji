---
sidebar_position: 10
_i18n_hash: 5ff3432ae327097b85732e04b2cda2d3
---
# 環境変数

Tianjiは、その動作をカスタマイズできる様々な環境変数をサポートしています。これらの変数は、Docker Composeの`env`フィールドやデプロイメント環境で設定することができます。

## 基本設定

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `PORT` | サーバーポート | `12345` | `3000` |
| `JWT_SECRET` | JWTトークンの秘密鍵 | ランダムなテキスト | `your-secret-key` |
| `ALLOW_REGISTER` | ユーザー登録を可能にする | `false` | `true` |
| `ALLOW_OPENAPI` | OpenAPIアクセスを可能にする | `true` | `false` |
| `WEBSITE_ID` | ウェブサイト識別子 | - | `your-website-id` |
| `DISABLE_AUTO_CLEAR` | 自動データクリーンアップを無効にする | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | アクセスログを無効にする | `false` | `true` |
| `DB_DEBUG` | データベースデバッグを有効にする | `false` | `true` |

## 認証

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | アカウントベースの認証を無効にする | `false` | `true` |
| `AUTH_SECRET` | 認証用の秘密鍵 | JWT秘密鍵のMD5 | `your-auth-secret` |
| `AUTH_RESTRICT_EMAIL` | 特定のメールドメインへの登録を制限 | - | `@example.com` |

### メール認証

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `EMAIL_SERVER` | メール用SMTPサーバー | - | `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | メール送信元アドレス | - | `noreply@example.com` |

### GitHub認証

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `AUTH_GITHUB_ID` | GitHub OAuthクライアントID | - | `your-github-client-id` |
| `AUTH_GITHUB_SECRET` | GitHub OAuthクライアントシークレット | - | `your-github-client-secret` |

### Google認証

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `AUTH_GOOGLE_ID` | Google OAuthクライアントID | - | `your-google-client-id` |
| `AUTH_GOOGLE_SECRET` | Google OAuthクライアントシークレット | - | `your-google-client-secret` |

### カスタムOAuth/OIDC認証

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `AUTH_CUSTOM_ID` | カスタムOAuth/OIDCクライアントID | - | `your-custom-client-id` |
| `AUTH_CUSTOM_SECRET` | カスタムOAuth/OIDCクライアントシークレット | - | `your-custom-client-secret` |
| `AUTH_CUSTOM_NAME` | カスタムプロバイダー名 | `Custom` | `Enterprise SSO` |
| `AUTH_CUSTOM_TYPE` | 認証タイプ | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUR` | OIDC発行元URL | - | `https://auth.example.com` |

## AI機能

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI APIキー | - | `your-openai-api-key` |
| `OPENAI_BASE_URL` | カスタムOpenAI API URL | - | `https://api.openai.com/v1` |
| `OPENAI_MODEL_NAME` | 使用するOpenAIモデル | `gpt-4o` | `gpt-3.5-turbo` |
| `DEBUG_AI_FEATURE` | AI機能をデバッグ | `false` | `true` |

## サンドボックス設定

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `USE_VM2` | VM2を使用してサンドボックスを実行 | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | サンドボックスのメモリ制限（MB） | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Puppeteerの実行可能パスのカスタム設定 | - | `/usr/bin/chromium` |

## マップ統合

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | AMap（高徳）APIトークン | - | `your-amap-token` |
| `MAPBOX_TOKEN` | Mapbox APIトークン | - | `your-mapbox-token` |

## テレメトリー

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | 匿名テレメトリーを無効にする | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | カスタムトラッカースクリプト名 | - | `custom-tracker.js` |

## 環境変数の設定

これらの環境変数は、以下の方法で設定することができます：

1. デプロイメント環境（Docker、Kubernetesなど）で直接設定する

2. Dockerデプロイメントの場合は、docker-compose.ymlで下記のように環境変数を使用します：

```yaml
services:
  tianji:
    image: moonrailgun/tianji:latest
    environment:
      - PORT=3000
      - ALLOW_REGISTER=true
```

## ブール値

ブール型の環境変数には、機能を有効にするために`"1"`または`"true"`を使うことができ、無効化する場合は変数を省略するか他の値を設定してください。
