---
sidebar_position: 1
_i18n_hash: 50d592e977b3f195d40bd2931b68269b
---
# 与MCP集成

<a href="https://cursor.com/install-mcp?name=tianji&config=eyJ0eXBlIjoic3RkaW8iLCJjb21tYW5kIjoibnB4IC15IHRpYW5qaS1tY3Atc2VydmVyIiwiZW52Ijp7IlRJQU5KSV9CQVNFX1VSTCI6IiIsIlRJQU5KSV9BUElfS0VZIjoiIiwiVElBTkpJX1dPUktTUEFDRV9JRCI6IiJ9fQ%3D%3D"><em><img src="https://cursor.com/deeplink/mcp-install-light.svg" alt="Add tianji MCP server to Cursor" height="32" /></em></a>
<br />
[![添加到Kiro](https://kiro.dev/images/add-to-kiro.svg)](https://kiro.dev/launch/mcp/add?name=tianji&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22tianji-mcp-server%22%5D%2C%22env%22%3A%7B%22TIANJI_BASE_URL%22%3A%22https%3A%2F%2Ftianji.example.com%22%2C%22TIANJI_API_KEY%22%3A%22%3Cyour-api-key%3E%22%2C%22TIANJI_WORKSPACE_ID%22%3A%22%3Cyour-workspace-id%3E%22%7D%7D)

## 简介

Tianji MCP Server是一个基于Model Context Protocol (MCP)的服务器，作为AI助手与Tianji平台之间的桥梁。它通过MCP协议向AI助手开放Tianji平台的调查功能。该服务器提供以下核心功能：

- 查询调查结果
- 获取详细的调查信息
- 获取工作区中的所有调查
- 获取网站列表

## 安装方法

### NPX安装

您可以通过在AI助手的配置文件中添加以下配置来使用Tianji MCP Server：

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

在使用Tianji MCP Server之前，您需要设置以下环境变量：

```bash
# Tianji平台API基础URL
TIANJI_BASE_URL=https://tianji.example.com

# Tianji平台API密钥
TIANJI_API_KEY=your_api_key_here

# Tianji平台工作空间ID
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### 获取API密钥

您可以通过以下步骤获取Tianji平台的API密钥：

1. 登录Tianji平台后，点击右上角的**头像**
2. 从下拉菜单中选择**个人资料**
3. 在个人资料页面，找到**API密钥**选项
4. 单击创建新密钥，并按照提示完成密钥创建

## 使用说明

Tianji MCP Server提供了一系列工具，可以通过MCP协议与AI助手进行交互。以下是每个工具的详细说明：

### 查询调查结果

使用`tianji_get_survey_results`工具查询特定调查的结果数据。

**参数：**

- `workspaceId`: Tianji工作区ID（默认为环境变量配置的值）
- `surveyId`: 调查ID
- `limit`: 返回记录的数量限制（默认为20）
- `cursor`: 分页光标（可选）
- `startAt`: 开始时间，ISO格式，例：2023-10-01T00:00:00Z
- `endAt`: 结束时间，ISO格式，例：2023-10-31T23:59:59Z
- `filter`: 过滤条件（可选）

### 获取调查信息

使用`tianji_get_survey_info`工具获取特定调查的基本信息。

**参数：**

- `workspaceId`: Tianji工作区ID（默认为环境变量配置的值）
- `surveyId`: 调查ID

### 获取所有调查列表

使用`tianji_get_all_survey_list`工具获取工作区中的所有调查列表。

**参数：**

- `workspaceId`: Tianji工作区ID（默认为环境变量配置的值）

### 获取网站列表

使用`tianji_get_website_list`工具获取工作区中的网站列表。

**参数：**

- `workspaceId`: Tianji工作区ID（默认为环境变量配置的值）

## 使用示例

以下是用户与集成了Tianji MCP Server的AI助手之间自然语言交互的示例：

### 示例1：获取所有调查列表

```
用户：帮我查看所有问卷调查列表

AI助手：我将为您获取所有的问卷调查列表。
[AI助手通过MCP协议调用tianji_get_all_survey_list获取数据]
根据您的工作区资料，您目前有以下调查：
1. 用户体验满意度调查（创建于2023-09-15）
2. 产品功能反馈调查（创建于2023-10-01）
3. 网站可用性评估（创建于2023-10-20）
```

### 示例2：获取特定调查详情

```
用户：请告诉我"用户体验满意度调查"的详细信息

AI助手：我将为您查询该调查的详细信息。
[AI助手通过MCP协议调用tianji_get_survey_info获取数据]
"用户体验满意度调查"的详情：
- 创建时间：2023-09-15
- 状态：活跃
- 问题数量：10
- 收集到的回应：128
- 最近回应：2023-10-25
```

### 示例3：查询调查结果

```
用户：帮我分析"产品功能反馈调查"十月的结果

AI助手：我将为您分析"产品功能反馈调查"十月的结果。
[AI助手通过MCP协议调用tianji_get_survey_results获取特定时间范围内的数据]
"产品功能反馈调查"十月结果分析：
- 总回应数：42
- 最受欢迎的功能：自动化报告（85%的正面反馈）
- 最需要改进的功能：移动端适配（62%的人提到）
- 平均满意度评分：4.2/5
- 用户主要建议：添加数据导出功能，优化页面加载速度
```
