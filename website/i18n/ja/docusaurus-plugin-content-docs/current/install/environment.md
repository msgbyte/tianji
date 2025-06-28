---
sidebar_position: 10
_i18n_hash: f4200354a00e07423992df3afe66f818
---
# 環境変数

Tianjiでは、さまざまな環境変数を利用して動作をカスタマイズできます。これらの変数は、Docker Composeの`env`フィールドまたはデプロイメント環境で設定できます。

## 基本設定

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `PORT` | サーバーポート | `12345` | `3000` |
| `JWT_SECRET` | JWTトークンの秘密鍵 | 任意のテキスト | `your-secret-key` |
| `ALLOW_REGISTER` | ユーザー登録を有効化するか | `false` | `true` |
| `ALLOW_OPENAPI` | OpenAPIアクセスを有効化するか | `true` | `false` |
| `WEBSITE_ID` | ウェブサイト識別子 | - | `your-website-id` |
| `DISABLE_AUTO_CLEAR` | 自動データクリーンアップを無効化するか | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | アクセスログを無効化するか | `false` | `true` |
| `DB_DEBUG` | データベースデバッグを有効化するか | `false` | `true` |

## 認証

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | アカウントベースの認証を無効化するか | `false` | `true` |
| `AUTH_SECRET` | 認証の秘密鍵 | JWT秘密鍵のMD5 | `your-auth-secret` |
| `AUTH_RESTRICT_EMAIL` | 特定のメールドメインへの登録を制限する | - | `@example.com` |

### メール認証とメール招待

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `EMAIL_SERVER` | メール用SMTPサーバー | - | `smtp://user:pass@smtp.example.com:587` |
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
| `AUTH_CUSTOM_NAME` | カスタムプロバイダ名 | `Custom` | `Enterprise SSO` |
| `AUTH_CUSTOM_TYPE` | 認証タイプ | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUER` | OIDC発行元URL | - | `https://auth.example.com` |

## AI機能

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `SHARED_OPENAI_API_KEY` | OpenAI APIキー | - | `your-openai-api-key` |
| `SHARED_OPENAI_BASE_URL` | OpenAIのカスタムAPI URL | - | `https://api.openai.com/v1` |
| `SHARED_OPENAI_MODEL_NAME` | 使用するOpenAIモデル | `gpt-4o` | `gpt-3.5-turbo` |
| `DEBUG_AI_FEATURE` | AI機能をデバッグするか | `false` | `true` |

## サンドボックス設定

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `USE_VM2` | VM2をサンドボックス実行に使用するか | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | サンドボックスのメモリ制限(MB) | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Puppeteer実行可能ファイルのカスタムパス | - | `/usr/bin/chromium` |

## 地図連携

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | 高徳地図(Gaode)APIトークン | - | `your-amap-token` |
| `MAPBOX_TOKEN` | Mapbox APIトークン | - | `your-mapbox-token` |

## テレメトリー

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | 匿名テレメトリーを無効化するか | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | カスタムトラッカースクリプト名 | - | `custom-tracker.js` |

## 環境変数の設定

これらの環境変数は、以下の方法で設定できます：

1. デプロイメント環境（Docker、Kubernetesなど）に直接設定する。
   
2. Dockerデプロイメントの場合、docker-compose.ymlで環境変数を使用する：

```yaml
services:
  tianji:
    image: moonrailgun/tianji:latest
    environment:
      - PORT=3000
      - ALLOW_REGISTER=true
```

## ブール値

ブール型の環境変数については、機能を有効にするためには`"1"`または`"true"`を使用し、無効にするためには変数を省略するか他の値を設定します。
