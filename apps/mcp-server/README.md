# Tianji MCP Server

A server based on Model Context Protocol (MCP) that provides tools for interacting with the Tianji platform.

## Introduction

Tianji MCP Server is a bridge connecting AI assistants with the Tianji platform, exposing survey functionality from the Tianji platform to AI assistants through the MCP protocol. This server provides the following core features:

- Query survey results
- Get detailed survey information  
- Get list of all surveys in workspace

## Install

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

## Environment Variables

Before using, you need to set the following environment variables:

```bash
# Tianji Platform API Base URL
TIANJI_BASE_URL=https://tianji.example.com

# Tianji Platform API Key
TIANJI_API_KEY=your_api_key_here

# Tianji Platform Workspace ID
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

## License

[MIT](LICENSE)
