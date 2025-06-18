---
sidebar_position: 10
_i18n_hash: 0648c6e4c85f3bd3ac4cdd91fad4eb39
---
# 環境変数

Tianjiは動作をカスタマイズするために様々な環境変数をサポートしています。これらの変数はdocker composeの`env`フィールドまたはデプロイメント環境で設定できます。

## 基本設定

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `PORT` | サーバーポート | `12345` | `3000` |
| `JWT_SECRET` | JWTトークンの秘密鍵 | ランダムテキスト | `your-secret-key` |
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
| `AUTH_SECRET` | 認証の秘密鍵 | JWTの秘密鍵のMD5 | `your-auth-secret` |
| `AUTH_RESTRICT_EMAIL` | 特定のメールドメインへの登録を制限する | - | `@example.com` |

### メール認証と招待

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `EMAIL_SERVER` | メールのSMTPサーバー | - | `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | メール送信者アドレス | - | `noreply@example.com` |

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
| `AUTH_CUSTOM_ISSUR` | OIDC issuer URL | - | `https://auth.example.com` |

## AI機能

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `SHARED_OPENAI_API_KEY` | OpenAI APIキー | - | `your-openai-api-key` |
| `SHARED_OPENAI_BASE_URL` | カスタムOpenAI API URL | - | `https://api.openai.com/v1` |
| `SHARED_OPENAI_MODEL_NAME` | 使用するOpenAIモデル | `gpt-4o` | `gpt-3.5-turbo` |
| `DEBUG_AI_FEATURE` | AI機能をデバッグする | `false` | `true` |

## サンドボックス設定

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `USE_VM2` | サンドボックス実行にVM2を使用 | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | サンドボックスのメモリ制限（MB単位） | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Puppeteerの実行可能パスをカスタム設定 | - | `/usr/bin/chromium` |

## 地図統合

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | AMap（高德）のAPIトークン | - | `your-amap-token` |
| `MAPBOX_TOKEN` | Mapbox APIトークン | - | `your-mapbox-token` |

## テレメトリー

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | 匿名のテレメトリーを無効にする | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | カスタムトラッカースクリプト名 | - | `custom-tracker.js` |

## 環境変数の設定

これらの環境変数は以下の方法で設定可能です：

1. デプロイ環境（Docker、Kubernetesなど）で直接設定。

2. Dockerデプロイでは、docker-compose.ymlで環境変数を使用可能：

```yaml
services:
  tianji:
    image: moonrailgun/tianji:latest
    environment:
      - PORT=3000
      - ALLOW_REGISTER=true
```

## ブール値

ブール型の環境変数は、機能を有効にするために`"1"`または`"true"`を使用し、無効にするには変数を省略するかそれ以外の値を設定します。
