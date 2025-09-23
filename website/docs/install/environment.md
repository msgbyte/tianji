---
sidebar_position: 10
---

# Environment Variables

Tianji supports various environment variables to customize its behavior. You can configure these variables in your docker compose `env` field or through your deployment environment.

## Basic Configuration

| Variable | Description | Default | Example |
| --- | --- | --- | --- |
| `PORT` | Server port | `12345` | `3000` |
| `JWT_SECRET` | Secret for JWT tokens | Random Text | `your-secret-key` |
| `ALLOW_REGISTER` | Enable user registration | `false` | `true` |
| `ALLOW_OPENAPI` | Enable OpenAPI access | `true` | `false` |
| `WEBSITE_ID` | Website identifier | - | `your-website-id` |
| `DISABLE_AUTO_CLEAR` | Disable automatic data cleanup | `false` | `true` |
| `DISABLE_ACCESS_LOGS` | Disable access logs | `false` | `true` |
| `DB_DEBUG` | Enable database debugging | `false` | `true` |
| `ALPHA_MODE` | Enable alpha features | `false` | `true` |
| `ENABLE_FUNCTION_WORKER` | Enable function worker | `false` | `true` |
| `REGISTER_AUTO_JOIN_WORKSPACE_ID` | Auto-join workspace ID for new users | - | `workspace-id-123` |

## Cache Configuration

| Variable | Description | Default | Example |
| --- | --- | --- | --- |
| `CACHE_MEMORY_ONLY` | Use memory-only caching | `false` | `true` |
| `REDIS_URL` | Redis connection URL | - | `redis://localhost:6379` |

## Authentication

| Variable | Description | Default | Example |
| --- | --- | --- | --- |
| `DISABLE_ACCOUNT` | Disable account-based authentication | `false` | `true` |
| `AUTH_SECRET` | Authentication secret | MD5 of JWT secret | `your-auth-secret` |
| `AUTH_RESTRICT_EMAIL` | Restrict registration to specific email domains | - | `@example.com` |
| `AUTH_USE_SECURE_COOKIES` | Use secure cookies for authentication | `false` | `true` |

### Email Authentication and Email Invitation

| Variable | Description | Default | Example |
| --- | --- | --- | --- |
| `EMAIL_SERVER` | SMTP server for email | - | `smtp://user:pass@smtp.example.com:587` |
| `EMAIL_FROM` | Email sender address | - | `noreply@example.com` |

### GitHub Authentication

| Variable | Description | Default | Example |
| --- | --- | --- | --- |
| `AUTH_GITHUB_ID` | GitHub OAuth client ID | - | `your-github-client-id` |
| `AUTH_GITHUB_SECRET` | GitHub OAuth client secret | - | `your-github-client-secret` |

### Google Authentication

| Variable | Description | Default | Example |
| --- | --- | --- | --- |
| `AUTH_GOOGLE_ID` | Google OAuth client ID | - | `your-google-client-id` |
| `AUTH_GOOGLE_SECRET` | Google OAuth client secret | - | `your-google-client-secret` |

### Custom OAuth/OIDC Authentication

| Variable | Description | Default | Example |
| --- | --- | --- | --- |
| `AUTH_CUSTOM_ID` | Custom OAuth/OIDC client ID | - | `your-custom-client-id` |
| `AUTH_CUSTOM_SECRET` | Custom OAuth/OIDC client secret | - | `your-custom-client-secret` |
| `AUTH_CUSTOM_NAME` | Custom provider name | `Custom` | `Enterprise SSO` |
| `AUTH_CUSTOM_TYPE` | Authentication type | `oidc` | `oauth` |
| `AUTH_CUSTOM_ISSUER` | OIDC issuer URL | - | `https://auth.example.com` |

## AI Features

| Variable | Description | Default | Example |
| --- | --- | --- | --- |
| `SHARED_OPENAI_API_KEY` | OpenAI API key | - | `your-openai-api-key` |
| `SHARED_OPENAI_BASE_URL` | Custom OpenAI API URL | - | `https://api.openai.com/v1` |
| `SHARED_OPENAI_MODEL_NAME` | OpenAI model to use | `gpt-4o` | `gpt-3.5-turbo` |
| `SHARED_OPENAI_TOKEN_CALC_CONCURRENCY` | Token calculation concurrency | `5` | `10` |
| `DEBUG_AI_FEATURE` | Debug AI features | `false` | `true` |

## ClickHouse Configuration

| Variable | Description | Default | Example |
| --- | --- | --- | --- |
| `CLICKHOUSE_URL` | ClickHouse database URL | - | `http://localhost:8123` |
| `CLICKHOUSE_USER` | ClickHouse username | - | `default` |
| `CLICKHOUSE_PASSWORD` | ClickHouse password | - | `your-password` |
| `CLICKHOUSE_DATABASE` | ClickHouse database name | - | `tianji` |
| `CLICKHOUSE_DEBUG` | Enable ClickHouse debugging | `false` | `true` |
| `CLICKHOUSE_DISABLE_SYNC` | Disable ClickHouse synchronization | `false` | `true` |
| `CLICKHOUSE_SYNC_BATCH_SIZE` | Synchronization batch size | `10000` | `5000` |
| `CLICKHOUSE_ENABLE_FALLBACK` | Enable ClickHouse fallback | `true` | `false` |
| `CLICKHOUSE_HEALTH_CHECK_INTERVAL` | Health check interval (ms) | `30000` | `60000` |
| `CLICKHOUSE_MAX_CONSECUTIVE_FAILURES` | Maximum consecutive failures | `3` | `5` |
| `CLICKHOUSE_RETRY_INTERVAL` | Retry interval (ms) | `5000` | `10000` |

## Billing System (LemonSqueezy)

| Variable | Description | Default | Example |
| --- | --- | --- | --- |
| `ENABLE_BILLING` | Enable billing functionality | `false` | `true` |
| `LEMON_SQUEEZY_SIGNATURE_SECRET` | LemonSqueezy webhook signature secret | - | `your-signature-secret` |
| `LEMON_SQUEEZY_API_KEY` | LemonSqueezy API key | - | `your-api-key` |
| `LEMON_SQUEEZY_STORE_ID` | LemonSqueezy store ID | - | `your-store-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_FREE_ID` | Free tier subscription variant ID | - | `free-variant-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_PRO_ID` | Pro tier subscription variant ID | - | `pro-variant-id` |
| `LEMON_SQUEEZY_SUBSCRIPTION_TEAM_ID` | Team tier subscription variant ID | - | `team-variant-id` |

## Sandbox Configuration

| Variable | Description | Default | Example |
| --- | --- | --- | --- |
| `USE_VM2` | Use VM2 for sandbox execution | `false` | `true` |
| `SANDBOX_MEMORY_LIMIT` | Memory limit for sandbox (MB) | `16` | `32` |
| `PUPPETEER_EXECUTABLE_PATH` | Custom path to Puppeteer executable | - | `/usr/bin/chromium` |

## Maps Integration

| Variable | Description | Default | Example |
| --- | --- | --- | --- |
| `AMAP_TOKEN` | AMap (Gaode) API token | - | `your-amap-token` |
| `MAPBOX_TOKEN` | Mapbox API token | - | `your-mapbox-token` |

## Telemetry

| Variable | Description | Default | Example |
| --- | --- | --- | --- |
| `DISABLE_ANONYMOUS_TELEMETRY` | Disable anonymous telemetry | `false` | `true` |
| `CUSTOM_TRACKER_SCRIPT_NAME` | Custom tracker script name | - | `custom-tracker.js` |

## Setting Environment Variables

You can set these environment variables in different ways:

1. Set them directly in your deployment environment (Docker, Kubernetes, etc.)

2. For Docker deployments, you can use environment variables in your docker-compose.yml:

```yaml
services:
  tianji:
    image: moonrailgun/tianji:latest
    environment:
      - PORT=3000
      - ALLOW_REGISTER=true
```

## Boolean Values

For boolean environment variables, you can use either `"1"` or `"true"` to enable the feature, and either omit the variable or set it to any other value to disable it.
