---
sidebar_position: 1
_i18n_hash: 3bea21234680fc0342392f5d9887ba15
---
# 与代理技能的集成

## 介绍

**天机数据查询技能**是一个轻量级、与代理无关的技能包，使得 AI 代理（如 Cursor、Claude Code、Codex、Copilot CLI 等）可以通过其只读 OpenAPI 直接查询天机平台。

它遵循[agentskills.io](https://agentskills.io/specification)规范——一个 `SKILL.md` 文件加上参考文件。无需长时间运行的进程，无需额外的运行环境。

:::tip 快速开始
请参阅[安装指南](./installation.md)进行一键或手动设置。
:::

**涵盖内容：** 69 个 GET 端点，跨越 14 个服务域：

- **网站**——流量统计、页面浏览量、地理分布、Lighthouse 报告
- **监控**——正常运行状态、最近检查数据、监控事件
- **调查**——调查响应、结果统计、AI 类别
- **遥测**——自定义事件计数、遥测页面浏览量、指标
- **订阅源**——频道、事件流、订阅源状态
- **应用**——应用商店评论、应用信息、事件统计
- **计费/AI 网关/工作者/页面/工作区/全局/审计日志**

## 技能 vs MCP 服务器

天机提供两种方式与 AI 代理集成。选择适合您工作流程的：

| | 代理技能 | [MCP 服务器](/docs/mcp) |
|--|--|--|
| **形式** | 简单的文档文件 (`SKILL.md` + 参考) | 长时间运行的 Node.js 进程 |
| **运行时** | 无 — 代理使用 `curl` 或内置 HTTP 工具 | `npx tianji-mcp-server` |
| **覆盖面** | 69 个 GET 端点（只读，完整表面） | 工具的精选子集（读 + 部分写） |
| **设置** | 将文件放入代理的技能目录 | 将 MCP 配置添加到代理的配置文件中 |
| **适合** | Cursor / Claude Code / Codex / 任何遵循 agentskills.io 规范的代理 | 拥有一流 MCP 支持的代理 |

可以同时使用这两种方式而不冲突。

## 使用示例

安装后，您可以让您的 AI 代理使用自然语言进行提问，它将选择合适的端点：

### 示例 1：网站流量概览

```
用户：展示我主网站过去 7 天的页面浏览量。

代理：[调用 GET /open/workspace/{workspaceId}/website/all 找到站点]
      [然后 GET /open/workspace/{workspaceId}/website/{websiteId}/pageviews
      使用 startAt/endAt 覆盖 7 天]
      您的主网站过去 7 天收到了 12,438 次浏览，其中最高点是周二的 2,103 次。主要推荐来源：google.com (43%)。
```

### 示例 2：监控健康检查

```
用户：我有哪些监控当前处于停机状态？

代理：[调用 GET /open/workspace/{workspaceId}/monitor/all]
      [对每个监控调用 GET /open/workspace/{workspaceId}/monitor/{monitorId}/status]
      当前有 2 个监控处于停机状态：
      - api.example.com (HTTP 503, 上次正常工作 12 分钟前)
      - db-replica (TCP 超时, 上次正常工作 1 小时前)
      其他 8 个监控状态正常。
```

### 示例 3：调查结果分析

```
用户：总结一下“Q4 客户反馈”调查的响应。

代理：[调用 GET /open/workspace/{workspaceId}/survey/all 解析 ID]
      [然后调用 GET /open/workspace/{workspaceId}/survey/{surveyId}/stats]
      [然后使用分页光标调用 GET /open/workspace/{workspaceId}/survey/{surveyId}/result/list]
      “Q4 客户反馈”共收到 218 份回应。平均满意度 4.3/5。主要主题：仪表板性能（提到 47 次）。最受欢迎的功能请求：暗模式（提到 31 次）。
```

## 敏感数据处理

一些端点可能返回平台存储的秘密（如 AI 网关响应中的 `modelApiKey`，`customModelBaseUrl`）或 PII（工作区成员、审计日志、计费）。

技能会指导代理：

- **绝不显示** `apiKey`、`modelApiKey`、`secret`、`token`、`password` 或 `credential` 字段。
- **去除或省略**在总结响应时这些字段。
- 对于工作区成员/审计日志，除非用户明确要求详细信息，否则仅显示非敏感的元数据（名称、角色、时间戳）。

捆绑的 `openapi-readonly.json` 也会在模式级别预先去除这些字段，因此代理不会误依赖其结构。

## 来源

该技能源代码位于天机的仓库中 [`skills/tianji-data-query/`](https://github.com/msgbyte/tianji/tree/master/skills/tianji-data-query)。欢迎提交拉取请求。
