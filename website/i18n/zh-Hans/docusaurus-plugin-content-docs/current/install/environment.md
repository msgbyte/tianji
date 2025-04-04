---
sidebar_position: 10
_i18n_hash: 5ff3432ae327097b85732e04b2cda2d3
---
# 环境变量

Tianji支持多种环境变量以自定义其行为。您可以在docker compose的`env`字段或通过部署环境配置这些变量。

## 基础配置

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `PORT` | 服务器端口 | `12345` | `3000` |
| `JWT_SECRET` | JWT令牌的密钥 | 随机文本 | `your-secret-key` |
| `ALLOW_REGISTER` | 启用用户注册 | `false` | `true` |
| `ALLOW_OPENAPI` | 启用OpenAPI访问 | `true` | `false` |
| `WEBSITE_ID` | 网站标识符 | - | `your-website-id` |
| `DISABLE_AUTO_CLEAR` | 禁用自动清理数据 | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | 禁用访问日志 | `false` | `true` |
| `DB_DEBUG` | 启用数据库调试 | `false` | `true` |

## 认证

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | 禁用基于账号的认证 | `false` | `true` |
| `AUTH_SECRET` | 认证密钥 | JWT密钥的MD5 | `your-auth-secret` |
| `AUTH_RESTRICT_EMAIL` | 限制注册到特定的邮箱域 | - | `@example.com` |

### 邮件认证

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `EMAIL_SERVER` | 邮件的SMTP服务器 | - | `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | 邮件发件地址 | - | `noreply@example.com` |

### GitHub认证

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `AUTH_GITHUB_ID` | GitHub OAuth客户端ID | - | `your-github-client-id` |
| `AUTH_GITHUB_SECRET` | GitHub OAuth客户端密钥 | - | `your-github-client-secret` |

### Google认证

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `AUTH_GOOGLE_ID` | Google OAuth客户端ID | - | `your-google-client-id` |
| `AUTH_GOOGLE_SECRET` | Google OAuth客户端密钥 | - | `your-google-client-secret` |

### 自定义OAuth/OIDC认证

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `AUTH_CUSTOM_ID` | 自定义OAuth/OIDC客户端ID | - | `your-custom-client-id` |
| `AUTH_CUSTOM_SECRET` | 自定义OAuth/OIDC客户端密钥 | - | `your-custom-client-secret` |
| `AUTH_CUSTOM_NAME` | 自定义提供商名称 | `Custom` | `Enterprise SSO` |
| `AUTH_CUSTOM_TYPE` | 认证类型 | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUR` | OIDC发行者URL | - | `https://auth.example.com` |

## AI功能

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `OPENAI_API_KEY` | OpenAI API密钥 | - | `your-openai-api-key` |
| `OPENAI_BASE_URL` | 自定义OpenAI API URL | - | `https://api.openai.com/v1` |
| `OPENAI_MODEL_NAME` | 使用的OpenAI模型 | `gpt-4o` | `gpt-3.5-turbo` |
| `DEBUG_AI_FEATURE` | 调试AI功能 | `false` | `true` |

## 沙箱配置

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `USE_VM2` | 使用VM2进行沙箱执行 | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | 沙箱内存限制（MB） | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Puppeteer执行文件的自定义路径 | - | `/usr/bin/chromium` |

## 地图集成

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | 高德（AMap）API令牌 | - | `your-amap-token` |
| `MAPBOX_TOKEN` | Mapbox API令牌 | - | `your-mapbox-token` |

## 遥测

| 变量 | 描述 | 默认值 | 示例 |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | 禁用匿名遥测 | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | 自定义追踪脚本名称 | - | `custom-tracker.js` |

## 设置环境变量

您可以通过不同方式设置这些环境变量：

1. 直接在您的部署环境（Docker、Kubernetes等）中设置它们。

2. 对于Docker部署，您可以使用在docker-compose.yml中的环境变量：

```yaml
services:
  tianji:
    image: moonrailgun/tianji:latest
    environment:
      - PORT=3000
      - ALLOW_REGISTER=true
```

## 布尔值

对于布尔环境变量，您可以使用 `"1"` 或 `"true"` 来启用该功能，省略变量或将其设置为其他任何值将禁用该功能。
