---
sidebar_position: 1
_i18n_hash: 3259721dc0b4a861181514a7b0e0add4
---
# 与MCP集成

## 简介

天机MCP服务器是一个基于模型上下文协议（MCP）的服务器，作为AI助手与天机平台之间的桥梁。它通过MCP协议向AI助手公开天机平台的调查功能。该服务器提供以下核心功能：

- 查询调查结果
- 获取详细调查信息
- 获取工作空间中的所有调查
- 获取网站列表

## 安装方法

### NPX安装

可以通过在AI助手的配置文件中添加以下配置来使用天机MCP服务器：

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

# 天机平台工作空间ID
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### 获取API密钥

可以通过以下步骤获取天机平台API密钥：

1. 登陆天机平台后，点击右上角的**头像**
2. 从下拉菜单中选择**个人资料**
3. 在个人资料页面，找到**API密钥**选项
4. 点击创建新密钥，并按照提示完成密钥创建

## 使用说明

天机MCP服务器提供了一系列工具，可以通过MCP协议与AI助手进行交互。以下是每个工具的详细描述：

### 查询调查结果

使用`tianji_get_survey_results`工具查询特定调查的结果数据。

**参数：**

- `workspaceId`：天机工作空间ID（默认为环境变量中配置的值）
- `surveyId`：调查ID
- `limit`：返回记录的数量限制（默认20）
- `cursor`：分页游标（可选）
- `startAt`：开始时间，ISO格式，例如：2023-10-01T00:00:00Z
- `endAt`：结束时间，ISO格式，例如：2023-10-31T23:59:59Z
- `filter`：过滤条件（可选）

### 获取调查信息

使用`tianji_get_survey_info`工具获取特定调查的基本信息。

**参数：**

- `workspaceId`：天机工作空间ID（默认为环境变量中配置的值）
- `surveyId`：调查ID

### 获取所有调查列表

使用`tianji_get_all_survey_list`工具获取工作空间中所有调查的列表。

**参数：**

- `workspaceId`：天机工作空间ID（默认为环境变量中配置的值）

### 获取网站列表

使用`tianji_get_website_list`工具获取工作空间中的网站列表。

**参数：**

- `workspaceId`：天机工作空间ID（默认为环境变量中配置的值）

## 使用示例

以下是与集成天机MCP服务器的AI助手之间的自然语言交互示例：

### 示例1：获取所有调查列表

```
用户：帮我查看所有我的调查问卷列表

AI助手：我将为你获取所有的调查问卷列表。
[AI助手通过MCP协议调用tianji_get_all_survey_list获取数据]
根据您工作空间中的数据，您目前有以下调查：
1. 用户体验满意度调查（创建于2023-09-15）
2. 产品特性反馈调查（创建于2023-10-01）
3. 网站可用性评估（创建于2023-10-20）
```

### 示例2：获取特定调查详情

```
用户：请告诉我"用户体验满意度调查"的详细信息

AI助手：我将为您查询该调查的详细信息。
[AI助手通过MCP协议调用tianji_get_survey_info获取数据]
"用户体验满意度调查"的详细信息：
- 创建时间：2023-09-15
- 状态：活跃
- 问题数量：10
- 收集到的回应：128
- 最近的回应：2023-10-25
```

### 示例3：查询调查结果

```
用户：帮我分析"产品特性反馈调查"十月份的结果

AI助手：我将分析"产品特性反馈调查"的十月份结果。
[AI助手通过MCP协议调用tianji_get_survey_results获取特定时间范围的数据]
十月份"产品特性反馈调查"结果分析：
- 总回应数：42
- 最受欢迎特性：自动化报告（85%好评）
- 最需改进特性：移动适配（62%提到）
- 平均满意度评分：4.2/5
- 用户主要建议：增加数据导出功能，优化页面加载速度
```
