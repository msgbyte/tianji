---
sidebar_position: 7
_i18n_hash: f6c7dbe145cf9dcabd803f4db67fbe69
---
# OpenAPI SDK 使用指南

本文档提供了使用Tianji SDK调用OpenAPI接口并实现对Tianji服务的完整编程访问的详细说明。

## 概述

Tianji OpenAPI SDK基于自动生成的TypeScript客户端，提供类型安全的API调用方法。通过SDK，您可以：

- 管理工作空间和网站
- 检索分析数据和统计信息
- 操作监控项目
- 管理调查
- 处理Feed渠道和事件
- ...

[完整API文档](/api)

## 安装和初始化

### 安装SDK

```bash
npm install tianji-client-sdk
# 或
yarn add tianji-client-sdk
# 或
pnpm add tianji-client-sdk
```

### 初始化OpenAPI客户端

```javascript
import { initOpenapiSDK } from 'tianji-client-sdk';

initOpenapiSDK('https://your-tianji-domain.com', {
  apiKey: 'your-api-key'
});
```

## 全局配置API

### 获取系统配置

```javascript
import { openApiClient } from 'tianji-client-sdk';

async function getSystemConfig() {
  try {
    const config = await openApiClient.GlobalService.globalConfig();
    
    console.log('允许注册:', config.allowRegister);
    console.log('启用AI功能:', config.enableAI);
    console.log('启用计费:', config.enableBilling);
    
    return config;
  } catch (error) {
    console.error('获取系统配置失败:', error);
  }
}
```
