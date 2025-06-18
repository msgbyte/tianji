---
sidebar_position: 1
---

# API Getting Started

Tianji provides a complete REST API that allows you to programmatically access and operate all Tianji features. This guide will help you quickly get started with the Tianji API.

## Overview

The Tianji API is based on REST architecture and uses JSON format for data exchange. All API requests must be made over HTTPS and require proper authentication.

### API Base URL

```bash
https://your-tianji-domain.com/open
```

### Supported Features

Through the Tianji API, you can:

- Manage website analytics data
- Create and manage monitoring projects
- Get server status information
- Manage surveys
- Operate telemetry data
- Create and manage workspaces

## Quick Start

### 1. Get API Key

Before using the API, you need to obtain an API key:

1. Log in to your Tianji instance
2. Click on your avatar in the top right corner
4. Find the **API Keys** section
5. Click the + button to create a new API key
6. Name your API key and save it

### 2. Enable OpenAPI

Make sure your Tianji instance has OpenAPI access enabled:

Set in your environment variables:
```bash
ALLOW_OPENAPI=true
```

### 3. First API Call

Test your API connection using curl:

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer <YOUR_API_KEY>" \
  -H "Content-Type: application/json"
```

## Next Steps

- Check the [Authentication Documentation](./authentication.md) for detailed authentication methods
- Browse the [API Reference Documentation](/api) for all available endpoints
- Use the [OpenAPI SDK](./openapi-sdk.md) for type-safe API calls
