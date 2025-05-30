---
sidebar_position: 7
---

# OpenAPI SDK Usage Guide

This document provides detailed instructions on how to use the Tianji SDK to call OpenAPI interfaces and achieve complete programmatic access to Tianji services.

## Overview

The Tianji OpenAPI SDK is based on an auto-generated TypeScript client, providing type-safe API calling methods. Through the SDK, you can:

- Manage workspaces and websites
- Retrieve analytics data and statistics
- Operate monitoring projects
- Manage surveys
- Handle Feed channels and events
- ...

[Complete API Documentation](/api)

## Installation and Initialization

### Install SDK

```bash
npm install tianji-client-sdk
# or
yarn add tianji-client-sdk
# or
pnpm add tianji-client-sdk
```

### Initialize OpenAPI Client

```javascript
import { initOpenapiSDK } from 'tianji-client-sdk';

initOpenapiSDK('https://your-tianji-domain.com', {
  apiKey: 'your-api-key'
});
```

## Global Configuration API

### Get System Configuration

```javascript
import { openApiClient } from 'tianji-client-sdk';

async function getSystemConfig() {
  try {
    const config = await openApiClient.GlobalService.globalConfig();
    
    console.log('Allow registration:', config.allowRegister);
    console.log('AI features enabled:', config.enableAI);
    console.log('Billing enabled:', config.enableBilling);
    
    return config;
  } catch (error) {
    console.error('Failed to get system configuration:', error);
  }
}
```
