---
sidebar_position: 10
_i18n_hash: a89f05aed50f89d55367e4d1d6598373
---

# 環境変数

Tianjiは、その動作をカスタマイズするためにさまざまな環境変数をサポートしています。これらの変数は、Docker Composeの `env` フィールドやデプロイ環境を通じて設定できます。

## 基本設定

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `PORT` | サーバーポート | `12345` | `3000` |
| `JWT_SECRET` | JWTトークンのための秘密鍵 | ランダムテキスト | `your-secret-key` |
| `ALLOW_REGISTER` | ユーザー登録を有効化 | `false` | `true` |
| `ALLOW_OPENAPI` | OpenAPIアクセスを有効化 | `true` | `false` |
| `WEBSITE_ID` | ウェブサイト識別子 | - | `your-website-id` |
| `DISABLE_AUTO_CLEAR` | 自動データクリーンアップを無効化 | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | アクセスログを無効化 | `false` | `true` |
| `DB_DEBUG` | データベースデバッグを有効化 | `false` | `true` |
| `ALPHA_MODE` | アルファ機能を有効化 | `false` | `true` |
| `ENABLE_FUNCTION_WORKER` | ファンクションワーカーを有効化 | `false` | `true` |
| `REGISTER_AUTO_JOIN_WORKSPACE_ID` | 新しいユーザーのためのワークスペースID自動参加 | - | `workspace-id-123` |

## キャッシュ設定

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `CACHE_MEMORY_ONLY` | メモリのみのキャッシングを使用 | `false` | `true` |
| `REDIS_URL` | Redis接続URL | - | `redis://localhost:6379` |

## 認証

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | アカウントベースの認証を無効化 | `false` | `true` |
| `AUTH_SECRET` | 認証の秘密鍵 | JWT秘密鍵のMD5 | `your-auth-secret` |
| `AUTH_RESTRICT_EMAIL` | 特定のメールドメインへの登録制限 | - | `@example.com` |
| `AUTH_USE_SECURE_COOKIES` | 認証にセキュアクッキーを使用 | `false` | `true` |

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
| `AUTH_CUSTOM_NAME` | カスタムプロバイダ名 | `Custom` | `Enterprise SSO` |
| `AUTH_CUSTOM_TYPE` | 認証タイプ | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUER` | OIDC発行者URL | - | `https://auth.example.com` |

## AI機能

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `SHARED_OPENAI_API_KEY` | OpenAI APIキー | - | `your-openai-api-key` |
| `SHARED_OPENAI_BASE_URL` | カスタムOpenAI API URL | - | `https://api.openai.com/v1` |
| `SHARED_OPENAI_MODEL_NAME` | 使用するOpenAIモデル | `gpt-4o` | `gpt-3.5-turbo` |
| `SHARED_OPENAI_TOKEN_CALC_CONCURRENCY` | トークン計算の並行性 | `5` | `10` |
| `DEBUG_AI_FEATURE` | AI機能のデバッグ | `false` | `true` |

## ClickHouse設定

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `CLICKHOUSE_URL` | ClickHouseデータベースURL | - | `http://localhost:8123` |
| `CLICKHOUSE_USER` | ClickHouseユーザー名 | - | `default` |
| `CLICKHOUSE_PASSWORD` | ClickHouseパスワード | - | `your-password` |
| `CLICKHOUSE_DATABASE` | ClickHouseデータベース名 | - | `tianji` |
| `CLICKHOUSE_DEBUG` | ClickHouseデバッグを有効化 | `false` | `true` |
| `CLICKHOUSE_DISABLE_SYNC` | ClickHouse同期を無効化 | `false` | `true` |
| `CLICKHOUSE_SYNC_BATCH_SIZE` | 同期バッチサイズ | `10000` | `5000` |
| `CLICKHOUSE_ENABLE_FALLBACK` | ClickHouseフォールバックを有効化 | `true` | `false` |
| `CLICKHOUSE_HEALTH_CHECK_INTERVAL` | ヘルスチェックの間隔（ms） | `30000` | `60000` |
| `CLICKHOUSE_MAX_CONSECUTIVE_FAILURES` | 最大連続失敗回数 | `3` | `5` |
| `CLICKHOUSE_RETRY_INTERVAL` | リトライ間隔（ms） | `5000` | `10000` |

## 請求システム（LemonSqueezy）

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `ENABLE_BILLING` | 請求機能を有効化 | `false` | `true` |
| `LEMON_SQUEEZY_SIGNATURE_SECRET` | LemonSqueezy webhookシグネチャ秘密鍵 | - | `your-signature-secret` |
| `LEMON_SQUEEZY_API_KEY` | LemonSqueezy APIキー | - | `your-api-key` |
| `LEMON_SQUEEZY_STORE_ID` | LemonSqueezyストアID | - | `your-store-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_FREE_ID` | 無料ティアのサブスクリプションバリアントID | - | `free-variant-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_PRO_ID` | プロティアのサブスクリプションバリアントID | - | `pro-variant-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_TEAM_ID` | チームティアのサブスクリプションバリアントID | - | `team-variant-id` |

## サンドボックス設定

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `USE_VM2` | サンドボックス実行にVM2を使用 | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | サンドボックスのメモリ制限（MB） | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Puppeteer実行ファイルのカスタムパス | - | `/usr/bin/chromium` |

## マップ統合

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | AMap（高徳）APIトークン | - | `your-amap-token` |
| `MAPBOX_TOKEN` | Mapbox APIトークン | - | `your-mapbox-token` |

## テレメトリー

| 変数 | 説明 | デフォルト | 例 |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | 匿名テレメトリーを無効化 | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | カスタムトラッカースクリプト名 | - | `custom-tracker.js` |

## 環境変数の設定

これらの環境変数は、さまざまな方法で設定できます：

1. デプロイ環境（Docker、Kubernetesなど）で直接設定する。

2. Dockerデプロイメントの場合、docker-compose.ymlで環境変数を使用できます：

```yaml
services:
  tianji:
    image: moonrailgun/tianji:latest
    environment:
      - PORT=3000
      - ALLOW_REGISTER=true
```

## ブール値

ブール値の環境変数には、機能を有効にするために `"1"` または `"true"` を使用できます。変数を省略するか、他の任意の値を設定することで無効化できます。
