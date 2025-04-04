---
sidebar_position: 1
---

# Integration with MCP

## Introduction

Tianji MCP Server is a server based on Model Context Protocol (MCP) that serves as a bridge between AI assistants and the Tianji platform. It exposes Tianji platform's survey functionality to AI assistants through the MCP protocol. This server provides the following core features:

- Query survey results
- Get detailed survey information
- Get all surveys in a workspace
- Get website list

## Installation Methods

### NPX Installation

You can use Tianji MCP Server by adding the following configuration to your AI assistant's configuration file:

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

### Environment Variable Configuration

Before using Tianji MCP Server, you need to set the following environment variables:

```bash
# Tianji platform API base URL
TIANJI_BASE_URL=https://tianji.example.com

# Tianji platform API key
TIANJI_API_KEY=your_api_key_here

# Tianji platform workspace ID
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### Getting an API Key

You can obtain a Tianji platform API key by following these steps:

1. After logging into the Tianji platform, click on your **profile picture** in the top right corner
2. Select **Profile** from the dropdown menu
3. On the profile page, find the **API Keys** option
4. Click on create new key, and follow the prompts to complete the key creation

## Usage Instructions

Tianji MCP Server provides a series of tools that can interact with AI assistants through the MCP protocol. Below are detailed descriptions of each tool:

### Query Survey Results

Use the `tianji_get_survey_results` tool to query result data for a specific survey.

**Parameters:**

- `workspaceId`: Tianji workspace ID (defaults to the value configured in environment variables)
- `surveyId`: Survey ID
- `limit`: Limit on the number of records returned (default 20)
- `cursor`: Pagination cursor (optional)
- `startAt`: Start time, ISO format, example: 2023-10-01T00:00:00Z
- `endAt`: End time, ISO format, example: 2023-10-31T23:59:59Z
- `filter`: Filter conditions (optional)

### Get Survey Information

Use the `tianji_get_survey_info` tool to get basic information about a specific survey.

**Parameters:**

- `workspaceId`: Tianji workspace ID (defaults to the value configured in environment variables)
- `surveyId`: Survey ID

### Get All Survey List

Use the `tianji_get_all_survey_list` tool to get a list of all surveys in the workspace.

**Parameters:**

- `workspaceId`: Tianji workspace ID (defaults to the value configured in environment variables)

### Get Website List

Use the `tianji_get_website_list` tool to get a list of websites in the workspace.

**Parameters:**

- `workspaceId`: Tianji workspace ID (defaults to the value configured in environment variables)

## Usage Examples

Below are examples of natural language interactions between users and AI assistants integrated with Tianji MCP Server:

### Example 1: Get All Survey List

```
User: Help me view all my survey questionnaire lists

AI Assistant: I'll get all your survey questionnaire lists for you.
[AI Assistant calls tianji_get_all_survey_list through MCP protocol to get data]
Based on the data in your workspace, you currently have the following surveys:
1. User Experience Satisfaction Survey (created on 2023-09-15)
2. Product Feature Feedback Survey (created on 2023-10-01)
3. Website Usability Assessment (created on 2023-10-20)
```

### Example 2: Get Specific Survey Details

```
User: Please tell me the details of the "User Experience Satisfaction Survey"

AI Assistant: I'll query the details of that survey for you.
[AI Assistant calls tianji_get_survey_info through MCP protocol to get data]
Details of the "User Experience Satisfaction Survey":
- Creation time: 2023-09-15
- Status: Active
- Number of questions: 10
- Responses collected: 128
- Most recent response: 2023-10-25
```

### Example 3: Query Survey Results

```
User: Help me analyze the October results of the "Product Feature Feedback Survey"

AI Assistant: I'll analyze the October results of the "Product Feature Feedback Survey".
[AI Assistant calls tianji_get_survey_results through MCP protocol to get data for the specific time range]
Analysis of the October "Product Feature Feedback Survey" results:
- Total responses: 42
- Most popular feature: Automated Reports (85% positive feedback)
- Feature most in need of improvement: Mobile adaptation (mentioned by 62%)
- Average satisfaction rating: 4.2/5
- Main user suggestions: Add data export functionality, optimize page loading speed
```
