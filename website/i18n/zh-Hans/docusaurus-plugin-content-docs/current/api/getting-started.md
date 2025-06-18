---
sidebar_position: 1
_i18n_hash: a144af118d2aa2c5e95b1cee1897ae7a
---
# API 入门指南

Tianji 提供了完整的 REST API，允许您以编程方式访问和操作所有 Tianji 功能。本指南将帮助您快速开始使用 Tianji API。

## 概述

Tianji API 基于 REST 架构，并使用 JSON 格式进行数据交换。所有 API 请求必须通过 HTTPS 进行，并需要正确的身份验证。

### API 基础 URL

```bash
https://your-tianji-domain.com/open
```

### 支持的功能

通过 Tianji API，您可以：

- 管理网站分析数据
- 创建和管理监控项目
- 获取服务器状态信息
- 管理调查问卷
- 操作遥测数据
- 创建和管理工作区

## 快速入门

### 1. 获取 API 密钥

在使用 API 之前，您需要获取 API 密钥：

1. 登录到您的 Tianji 实例
2. 点击右上角的头像
3. 找到 **API 密钥** 部分
4. 点击 + 按钮创建新的 API 密钥
5. 为您的 API 密钥命名并保存

### 2. 启用 OpenAPI

确保您的 Tianji 实例已启用 OpenAPI 访问：

在您的环境变量中设置：
```bash
ALLOW_OPENAPI=true
```

### 3. 第一个 API 调用

使用 curl 测试您的 API 连接：

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json"
```

## 下一步

- 查看 [身份验证文档](./authentication.md) 了解详细的身份验证方法
- 浏览 [API 参考文档](/api) 获取所有可用的端点
- 使用 [OpenAPI SDK](./openapi-sdk.md) 进行类型安全的 API 调用
