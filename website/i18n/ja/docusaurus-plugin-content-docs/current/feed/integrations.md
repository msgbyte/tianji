---
sidebar_position: 5
_i18n_hash: 2ebf85a054d427b1cfc8e50c237bede0
---
# 統合

Tianjiは、サードパーティのペイロードをFeedイベントに変換するためのビルトインのWebhookアダプターを提供しています。

## GitHub

エンドポイント

POST `/open/feed/{channelId}/github`

注意

- "application/json"のコンテンツタイプを使用してください。
- ヘッダー`X-GitHub-Event`はGitHubによって要求され、アダプターによって消費されます。
- サポートされているタイプ：`push`、`star`、`issues`（開かれた/閉じた）。他のものは不明としてログに記録されます。

## Stripe

エンドポイント

POST `/open/feed/{channelId}/stripe`

注意

- 上記のURLにポイントするStripeのWebhookエンドポイントを設定してください。
- サポートされているタイプ：`payment_intent.succeeded`、`payment_intent.canceled`、`customer.subscription.created`、`customer.subscription.deleted`。

## Sentry

エンドポイント

POST `/open/feed/{channelId}/sentry`

注意

- ヘッダー`Sentry-Hook-Resource: event_alert`とアクション`triggered`はFeedイベントにマッピングされます。
- "Integration with Sentry"のステップバイステップスクリーンショットを参照してください。

## テンセントクラウドアラーム

エンドポイント

POST `/open/feed/{channelId}/tencent-cloud/alarm`

注意

- アラームタイプ`event`および`metric`をサポートします。ペイロードが検証され、不正なリクエストは拒否されます。

## Webhook プレイグラウンド

エンドポイント

POST `/open/feed/playground/{workspaceId}`

注意

- ヘッダー/ボディ/メソッド/URLをワークスペースのリアルタイムプレイグラウンドにエコーし、統合のデバッグを行います。
