---
sidebar_position: 1
_i18n_hash: bf0ff03e7619ebadc59e7451f16ddf69
---
# 与MCP的集成

<a href="https://cursor.com/install-mcp?name=tianji&config=eyJ0eXBlIjoic3RkaW8iLCJjb21tYW5kIjoibnB4IC15IHRpYW5qaS1tY3Atc2VydmVyIiwiZW52Ijp7IlRJQU5KSV9CQVNFX1VSTCI6IiIsIlRJQU5KSV9BUElfS0VZIjoiIiwiVElBTkpJX1dPUktTUEFDRV9JRCI6IiJ9fQ%3D%3D"><em><img src="https://cursor.com/deeplink/mcp-install-light.svg" alt="Add tianji MCP server to Cursor" height="32" /></em></a>

## 简介

天机MCP服务器是基于模型上下文协议（MCP）的服务器，作为AI助手和天机平台之间的桥梁。它通过MCP协议将天机平台的调查功能暴露给AI助手。此服务器提供以下核心功能：

- 查询调查结果
- 获取详细调查信息
- 获取工作区中的所有调查
- 获取网站列表

## 安装方法

### NPX安装

通过在AI助手的配置文件中添加以下配置，可以使用天机MCP服务器：

```json
{
  "mcpServers": {
    "tianji": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "tianji-mcp-server"
      ],
      "env": {
        "TIANJI_BASE_URL": "https://tianji.example.com",
        "TIANJI_API_KEY": "<your-api-key>",
        "TIANJI_WORKSPACE_ID": "<your-workspace-id>"
      }
    }
  }
}
```

### 环境变量配置

在使用天机MCP服务器之前，需要设置以下环境变量：

```bash
# 天机平台API基础URL
TIANJI_BASE_URL=https://tianji.example.com

# 天机平台API密钥
TIANJI_API_KEY=your_api_key_here

# 天机平台工作区ID
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### 获取API密钥

可以通过以下步骤获取天机平台API密钥：

1. 登录天机平台后，点击右上角的**头像**
2. 从下拉菜单中选择**个人资料**
3. 在个人资料页面找到**API密钥**选项
4. 点击创建新密钥，并按照提示完成密钥的创建

## 使用说明

天机MCP服务器提供了一系列可以通过MCP协议与AI助手交互的工具。以下是每个工具的详细描述：

### 查询调查结果

使用`tianji_get_survey_results`工具查询特定调查的结果数据。

**参数：**

- `workspaceId`: 天机工作区ID（默认取环境变量中配置的值）
- `surveyId`: 调查ID
- `limit`: 返回记录数量限制（默认20）
- `cursor`: 分页游标（可选）
- `startAt`: 开始时间，ISO格式，例如：2023-10-01T00:00:00Z
- `endAt`: 结束时间，ISO格式，例如：2023-10-31T23:59:59Z
- `filter`: 过滤条件（可选）

### 获取调查信息

使用`tianji_get_survey_info`工具获取特定调查的基本信息。

**参数：**

- `workspaceId`: 天机工作区ID（默认取环境变量中配置的值）
- `surveyId`: 调查ID

### 获取所有调查列表

使用`tianji_get_all_survey_list`工具获取工作区中的所有调查列表。

**参数：**

- `workspaceId`: 天机工作区ID（默认取环境变量中配置的值）

### 获取网站列表

使用`tianji_get_website_list`工具获取工作区中的网站列表。

**参数：**

- `workspaceId`: 天机工作区ID（默认取环境变量中配置的值）

## 使用示例

以下是用户与集成了天机MCP服务器的AI助手进行自然语言交互的示例：

### 示例1：获取所有调查列表

```
用户：帮我查看所有我的调查问卷列表

AI助手：我将为您获取所有调查问卷列表。
[AI助手通过MCP协议调用tianji_get_all_survey_list获取数据]
根据您工作区中的数据，您目前有以下调查：
1. 用户体验满意度调查（创建于2023-09-15）
2. 产品功能反馈调查（创建于2023-10-01）
3. 网站可用性评估（创建于2023-10-20）
```

### 示例2：获取特定调查详情

```
用户：请告诉我“用户体验满意度调查”的详情

AI助手：我将为您查询该调查的详细信息。
[AI助手通过MCP协议调用tianji_get_survey_info获取数据]
“用户体验满意度调查”详情：
- 创建时间：2023-09-15
- 状态：活跃
- 问题数量：10
- 收集的回答：128
- 最新回答时间：2023-10-25
```

### 示例3：查询调查结果

```
用户：帮我分析一下“产品功能反馈调查”十月份的结果

AI助手：我将为您分析“产品功能反馈调查”十月份的结果。
[AI助手通过MCP协议调用tianji_get_survey_results获取特定时间范围的数据]
“产品功能反馈调查”十月份结果分析：
- 总回复：42
- 最受欢迎功能：自动化报告（85%正面反馈）
- 最需改进的功能：适配移动设备（62%提及）
- 平均满意度评分：4.2/5
- 用户主要建议：增加数据导出功能，优化页面加载速度
```
