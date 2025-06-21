---
sidebar_position: 100
_i18n_hash: 2419750faca3b35056a24bc0a5e02a22
---
# 疑难解答

本文档收集了使用天机时可能遇到的常见问题及其解决方案。

## WebSocket 连接问题

### 问题描述

在使用 HTTPS 服务时，其他功能正常工作，但 WebSocket 服务无法正常连接，表现为：

- 左下角的连接状态指示器显示为灰色
- 服务器页面列表显示计数但没有实际内容

### 根本原因

此问题通常是由反向代理软件中 WebSocket 转发策略不当引起的。在 HTTPS 环境中，WebSocket 连接需要正确的 Cookie 安全策略。

### 解决方案

通过设置以下环境变量可以解决此问题：

```bash
AUTH_USE_SECURE_COOKIES=true
```

此设置强制应用程序将浏览器传递的 Cookie 视为加密的 Cookie，从而解决 WebSocket 连接问题。

#### 配置方法

**Docker 环境：**
```yaml
# docker-compose.yml
services:
  tianji:
    environment:
      - AUTH_USE_SECURE_COOKIES=true
```

**直接部署：**
```bash
export AUTH_USE_SECURE_COOKIES=true
```

### 验证步骤

配置完成后，重启服务并检查：

1. 左下角连接状态指示器应显示为绿色
2. 服务器页面应正常显示实时数据
3. 在浏览器开发工具中应正常建立 WebSocket 连接

---

*如果您遇到其他问题，欢迎提交[问题](https://github.com/msgbyte/tianji/issues)或为本文档贡献解决方案。*
