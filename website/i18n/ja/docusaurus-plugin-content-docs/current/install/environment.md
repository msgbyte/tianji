---
sidebar_position: 10
_i18n_hash: f2ef2fcca017df87250ccfb0a4dc798c
---
```
# 環境変数

Tianjiは、様々な環境変数をサポートしており、その動作をカスタマイズできます。これらの変数は、docker compose の`env`フィールドや、デプロイメント環境を通じて設定できます。

## 基本設定

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `PORT` | サーバーポート | `12345` | `3000` |
| `JWT_SECRET` | JWTトークンの秘密キー | ランダムな文字列 | `your-secret-key` |
| `ALLOW_REGISTER` | ユーザー登録を有効にする | `false` | `true` |
| `ALLOW_OPENAPI` | OpenAPIアクセスを有効にする | `true` | `false` |
| `WEBSITE_ID` | ウェブサイト識別子 | - | `your-website-id` |
| `DISABLE_AUTO_CLEAR` | 自動データクリーンアップを無効にする | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | アクセスログを無効にする | `false` | `true` |
| `DB_DEBUG` | データベースデバッグを有効にする | `false` | `true` |

## 認証

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | アカウントベースの認証を無効にする | `false` | `true` |
| `AUTH_SECRET` | 認証用の秘密キー | JWT秘密のMD5 | `your-auth-secret` |
| `AUTH_RESTRICT_EMAIL` | 特定のメールドメインへの登録を制限する | - | `@example.com` |

### メール認証とメール招待

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
| `AUTH_CUSTOM_NAME` | カスタムプロバイダーの名前 | `Custom` | `Enterprise SSO` |
| `AUTH_CUSTOM_TYPE` | 認証タイプ | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUER` | OIDC発行者URL | - | `https://auth.example.com` |

## AI機能

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `SHARED_OPENAI_API_KEY` | OpenAI APIキー | - | `your-openai-api-key` |
| `SHARED_OPENAI_BASE_URL` | カスタムOpenAI API URL | - | `https://api.openai.com/v1` |
| `SHARED_OPENAI_MODEL_NAME` | 使用するOpenAIモデル | `gpt-4o` | `gpt-3.5-turbo` |
| `DEBUG_AI_FEATURE` | AI機能のデバッグ | `false` | `true` |

## サンドボックス設定

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `USE_VM2` | サンドボックス実行にVM2を使用 | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | サンドボックスのメモリ制限（MB） | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Puppeteer実行可能ファイルのカスタムパス | - | `/usr/bin/chromium` |

## 地図統合

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | AMap (Gaode) APIトークン | - | `your-amap-token` |
| `MAPBOX_TOKEN` | Mapbox APIトークン | - | `your-mapbox-token` |

## テレメトリー

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | 匿名テレメトリーを無効にする | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | カスタムトラッカースクリプト名 | - | `custom-tracker.js` |

## 環境変数の設定

これらの環境変数は、次の方法で設定できます：

1. デプロイメント環境（Docker、Kubernetes など）で直接設定

2. Dockerデプロイメントの場合、docker-compose.ymlで環境変数を使用：

```yaml
services:
  tianji:
    image: moonrailgun/tianji:latest
    environment:
      - PORT=3000
      - ALLOW_REGISTER=true
```

## ブール値

ブール値の環境変数については、`"1"` または `"true"` を使用して機能を有効にし、変数を省略するか他の値に設定して無効にします。
```
