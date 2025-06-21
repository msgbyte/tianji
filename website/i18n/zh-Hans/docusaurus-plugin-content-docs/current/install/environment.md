---
sidebar_position: 10
_i18n_hash: f2ef2fcca017df87250ccfb0a4dc798c
---
# 环境变量

Tianji 支持通过各种环境变量来自定义其行为。您可以在 docker compose 的 `env` 字段中或通过部署环境来配置这些变量。

## 基本配置

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `PORT` | 服务器端口 | `12345` | `3000` |
| `JWT_SECRET` | JWT 令牌的密钥 | 随机文本 | `your-secret-key` |
| `ALLOW_REGISTER` | 启用用户注册 | `false` | `true` |
| `ALLOW_OPENAPI` | 启用 OpenAPI 访问 | `true` | `false` |
| `WEBSITE_ID` | 网站标识符 | - | `your-website-id` |
| `DISABLE_AUTO_CLEAR` | 禁用自动数据清理 | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | 禁用访问日志 | `false` | `true` |
| `DB_DEBUG` | 启用数据库调试 | `false` | `true` |

## 认证

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | 禁用基于帐户的认证 | `false` | `true` |
| `AUTH_SECRET` | 认证密钥 | JWT 密钥的 MD5 | `your-auth-secret` |
| `AUTH_RESTRICT_EMAIL` | 限制注册到特定电子邮件域 | - | `@example.com` |

### 邮件认证和邮件邀请

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `EMAIL_SERVER` | 用于发送电子邮件的 SMTP 服务器 | - | `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | 电子邮件发件地址 | - | `noreply@example.com` |

### GitHub 认证

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `AUTH_GITHUB_ID` | GitHub OAuth 客户端 ID | - | `your-github-client-id` |
| `AUTH_GITHUB_SECRET` | GitHub OAuth 客户端密钥 | - | `your-github-client-secret` |

### Google 认证

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `AUTH_GOOGLE_ID` | Google OAuth 客户端 ID | - | `your-google-client-id` |
| `AUTH_GOOGLE_SECRET` | Google OAuth 客户端密钥 | - | `your-google-client-secret` |

### 自定义 OAuth/OIDC 认证

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `AUTH_CUSTOM_ID` | 自定义 OAuth/OIDC 客户端 ID | - | `your-custom-client-id` |
| `AUTH_CUSTOM_SECRET` | 自定义 OAuth/OIDC 客户端密钥 | - | `your-custom-client-secret` |
| `AUTH_CUSTOM_NAME` | 自定义提供者名称 | `Custom` | `Enterprise SSO` |
| `AUTH_CUSTOM_TYPE` | 认证类型 | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUR` | OIDC 发行者 URL | - | `https://auth.example.com` |

## AI 特性

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `SHARED_OPENAI_API_KEY` | OpenAI API 密钥 | - | `your-openai-api-key` |
| `SHARED_OPENAI_BASE_URL` | 自定义 OpenAI API URL | - | `https://api.openai.com/v1` |
| `SHARED_OPENAI_MODEL_NAME` | 使用的 OpenAI 模型 | `gpt-4o` | `gpt-3.5-turbo` |
| `DEBUG_AI_FEATURE` | 调试 AI 特性 | `false` | `true` |

## 沙箱配置

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `USE_VM2` | 使用 VM2 进行沙箱执行 | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | 沙箱的内存限制 (MB) | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Puppeteer 执行文件的自定义路径 | - | `/usr/bin/chromium` |

## 地图集成

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | 高德地图 API 密钥 | - | `your-amap-token` |
| `MAPBOX_TOKEN` | Mapbox API 密钥 | - | `your-mapbox-token` |

## 遥测

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | 禁用匿名遥测 | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | 自定义追踪脚本名称 | - | `custom-tracker.js` |

## 设置环境变量

您可以通过以下方式设置这些环境变量：

1. 直接在您的部署环境中设置（Docker, Kubernetes 等）

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

对于布尔环境变量，您可以使用 `"1"` 或 `"true"` 来启用特性，或者通过忽略该变量或将其设置为其他任意值来禁用它。
