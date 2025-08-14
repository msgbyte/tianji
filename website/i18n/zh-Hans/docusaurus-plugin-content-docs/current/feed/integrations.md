---
sidebar_position: 5
_i18n_hash: 2ebf85a054d427b1cfc8e50c237bede0
---
# 集成

Tianji 提供内置的 webhook 适配器，将第三方负载转换为 Feed 事件。

## GitHub

端点

POST `/open/feed/{channelId}/github`

注意事项

- 使用 "application/json" 内容类型。
- GitHub 需要并由适配器使用头部 `X-GitHub-Event`。
- 支持的类型：`push`、`star`、`issues`（打开/关闭）。其他类型将记录为未知。

## Stripe

端点

POST `/open/feed/{channelId}/stripe`

注意事项

- 配置 Stripe webhook 端点指向上述 URL。
- 支持的类型：`payment_intent.succeeded`、`payment_intent.canceled`、`customer.subscription.created`、`customer.subscription.deleted`。

## Sentry

端点

POST `/open/feed/{channelId}/sentry`

注意事项

- 头部 `Sentry-Hook-Resource: event_alert` 和操作 `triggered` 映射为 Feed 事件。
- 参见 "与 Sentry 集成" 中的逐步截图。

## 腾讯云告警

端点

POST `/open/feed/{channelId}/tencent-cloud/alarm`

注意事项

- 支持告警类型 `event` 和 `metric`。负载经过验证；无效请求将被拒绝。

## Webhook Playground

端点

POST `/open/feed/playground/{workspaceId}`

注意事项

- 回显头部/主体/方法/URL 到实时工作空间游乐场，用于调试集成。
