---
sidebar_position: 10
_i18n_hash: a89f05aed50f89d55367e4d1d6598373
---
# 环境变量

Tianji 支持各种环境变量来定制其行为。您可以在 Docker Compose 的 `env` 字段中配置这些变量，也可以通过您的部署环境进行配置。

## 基本配置

| 变量名 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `PORT` | 服务器端口 | `12345` | `3000` |
| `JWT_SECRET` | JWT 令牌的密钥 | 随机文本 | `your-secret-key` |
| `ALLOW_REGISTER` | 启用用户注册 | `false` | `true` |
| `ALLOW_OPENAPI` | 启用 OpenAPI 访问 | `true` | `false` |
| `WEBSITE_ID` | 网站标识符 | - | `your-website-id` |
| `DISABLE_AUTO_CLEAR` | 禁用自动数据清理 | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | 禁用访问日志 | `false` | `true` |
| `DB_DEBUG` | 启用数据库调试 | `false` | `true` |
| `ALPHA_MODE` | 启用 alpha 功能 | `false` | `true` |
| `ENABLE_FUNCTION_WORKER` | 启用功能工作器 | `false` | `true` |
| `REGISTER_AUTO_JOIN_WORKSPACE_ID` | 新用户自动加入的工作区 ID | - | `workspace-id-123` |

## 缓存配置

| 变量名 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `CACHE_MEMORY_ONLY` | 使用仅内存缓存 | `false` | `true` |
| `REDIS_URL` | Redis 连接 URL | - | `redis://localhost:6379` |

## 认证

| 变量名 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | 禁用基于账户的认证 | `false` | `true` |
| `AUTH_SECRET` | 认证密钥 | JWT 密钥的 MD5 值 | `your-auth-secret` |
| `AUTH_RESTRICT_EMAIL` | 限制注册特定邮箱域名 | - | `@example.com` |
| `AUTH_USE_SECURE_COOKIES` | 使用安全 Cookies 进行认证 | `false` | `true` |

### 邮件认证和邮件邀请

| 变量名 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `EMAIL_SERVER` | SMTP 邮件服务器 | - | `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | 邮件发送地址 | - | `noreply@example.com` |

### GitHub 认证

| 变量名 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `AUTH_GITHUB_ID` | GitHub OAuth 客户端 ID | - | `your-github-client-id` |
| `AUTH_GITHUB_SECRET` | GitHub OAuth 客户端密钥 | - | `your-github-client-secret` |

### Google 认证

| 变量名 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `AUTH_GOOGLE_ID` | Google OAuth 客户端 ID | - | `your-google-client-id` |
| `AUTH_GOOGLE_SECRET` | Google OAuth 客户端密钥 | - | `your-google-client-secret` |

### 自定义 OAuth/OIDC 认证

| 变量名 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `AUTH_CUSTOM_ID` | 自定义 OAuth/OIDC 客户端 ID | - | `your-custom-client-id` |
| `AUTH_CUSTOM_SECRET` | 自定义 OAuth/OIDC 客户端密钥 | - | `your-custom-client-secret` |
| `AUTH_CUSTOM_NAME` | 自定义提供商名称 | `Custom` | `企业 SSO` |
| `AUTH_CUSTOM_TYPE` | 认证类型 | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUER` | OIDC 发行者 URL | - | `https://auth.example.com` |

## AI 功能

| 变量名 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `SHARED_OPENAI_API_KEY` | OpenAI API 密钥 | - | `your-openai-api-key` |
| `SHARED_OPENAI_BASE_URL` | 自定义 OpenAI API URL | - | `https://api.openai.com/v1` |
| `SHARED_OPENAI_MODEL_NAME` | 使用的 OpenAI 模型 | `gpt-4o` | `gpt-3.5-turbo` |
| `SHARED_OPENAI_TOKEN_CALC_CONCURRENCY` | 令牌计算并发数 | `5` | `10` |
| `DEBUG_AI_FEATURE` | 调试 AI 功能 | `false` | `true` |

## ClickHouse 配置

| 变量名 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `CLICKHOUSE_URL` | ClickHouse 数据库 URL | - | `http://localhost:8123` |
| `CLICKHOUSE_USER` | ClickHouse 用户名 | - | `default` |
| `CLICKHOUSE_PASSWORD` | ClickHouse 密码 | - | `your-password` |
| `CLICKHOUSE_DATABASE` | ClickHouse 数据库名 | - | `tianji` |
| `CLICKHOUSE_DEBUG` | 启用 ClickHouse 调试 | `false` | `true` |
| `CLICKHOUSE_DISABLE_SYNC` | 禁用 ClickHouse 同步 | `false` | `true` |
| `CLICKHOUSE_SYNC_BATCH_SIZE` | 同步批量大小 | `10000` | `5000` |
| `CLICKHOUSE_ENABLE_FALLBACK` | 启用 ClickHouse 回退 | `true` | `false` |
| `CLICKHOUSE_HEALTH_CHECK_INTERVAL` | 健康检查间隔（ms） | `30000` | `60000` |
| `CLICKHOUSE_MAX_CONSECUTIVE_FAILURES` | 最大连续失败次数 | `3` | `5` |
| `CLICKHOUSE_RETRY_INTERVAL` | 重试间隔（ms） | `5000` | `10000` |

## 计费系统 (LemonSqueezy)

| 变量名 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `ENABLE_BILLING` | 启用计费功能 | `false` | `true` |
| `LEMON_SQUEEZY_SIGNATURE_SECRET` | LemonSqueezy Webhook 签名密钥 | - | `your-signature-secret` |
| `LEMON_SQUEEZY_API_KEY` | LemonSqueezy API 密钥 | - | `your-api-key` |
| `LEMON_SQUEEZY_STORE_ID` | LemonSqueezy 店铺 ID | - | `your-store-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_FREE_ID` | 免费层订阅变体 ID | - | `free-variant-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_PRO_ID` | 专业层订阅变体 ID | - | `pro-variant-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_TEAM_ID` | 团队层订阅变体 ID | - | `team-variant-id` |

## 沙箱配置

| 变量名 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `USE_VM2` | 使用 VM2 进行沙箱执行 | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | 沙箱内存限制 (MB) | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Puppeteer 可执行文件自定义路径 | - | `/usr/bin/chromium` |

## 地图集成

| 变量名 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | 高德地图 API Token | - | `your-amap-token` |
| `MAPBOX_TOKEN` | Mapbox API Token | - | `your-mapbox-token` |

## 遥测

| 变量名 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | 禁用匿名遥测 | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | 自定义追踪脚本名称 | - | `custom-tracker.js` |

## 设置环境变量

您可以通过以下方式设置这些环境变量：

1. 直接在您的部署环境（Docker、Kubernetes 等）中设置。

2. 对于 Docker 部署，您可以在 docker-compose.yml 中使用环境变量：

```yaml
services:
  tianji:
    image: moonrailgun/tianji:latest
    environment:
      - PORT=3000
      - ALLOW_REGISTER=true
```

## 布尔值

对于布尔环境变量，您可以使用 `"1"` 或 `"true"` 来启用该功能，或者省略该变量或设置为其他任何值来禁用它。
