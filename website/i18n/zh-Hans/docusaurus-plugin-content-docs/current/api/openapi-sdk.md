---
sidebar_position: 7
_i18n_hash: 31c4981c02a399801d9f7185e51b5e44
---
# OpenAPI SDK 使用指南

本文档提供了如何使用天机 SDK 调用 OpenAPI 接口的详细说明，实现对天机服务的完整编程访问。

## 概述

天机 OpenAPI SDK 基于自动生成的 TypeScript 客户端，提供类型安全的 API 调用方法。通过该 SDK，您可以：

- 管理工作区和网站
- 获取分析数据和统计信息
- 操作监控项目
- 管理调查
- 处理 Feed 通道和事件
- ...

[完整 API 文档](/api)

## 安装和初始化

### 安装 SDK

```bash
npm install tianji-client-sdk
# 或
yarn add tianji-client-sdk
# 或
pnpm add tianji-client-sdk
```

### 初始化 OpenAPI 客户端

```javascript
import { initOpenapiSDK } from 'tianji-client-sdk';

initOpenapiSDK('https://your-tianji-domain.com', {
  apiKey: 'your-api-key'
});
```

## 全局配置 API

### 获取系统配置

```javascript
import { openApiClient } from 'tianji-client-sdk';

async function getSystemConfig() {
  try {
    const config = await openApiClient.GlobalService.globalConfig();
    
    console.log('允许注册:', config.allowRegister);
    console.log('AI 功能启用:', config.ai.enable);
    console.log('计费启用:', config.enableBilling);
    
    return config;
  } catch (error) {
    console.error('获取系统配置失败:', error);
  }
}
```
