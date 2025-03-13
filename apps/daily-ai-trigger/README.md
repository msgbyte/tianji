# Daily AI Trigger (for Tianji)

A Cloudflare Workers-based scheduled trigger project for executing timed Tianji Survey AI-related tasks and summary generation.

## Features

- Built on Cloudflare Workers
- Supports scheduled task triggering
- Developed with TypeScript

## Development Requirements

- Node.js
- pnpm
- Wrangler CLI (Cloudflare Workers CLI tool)

## Installation

```bash
pnpm install
```

## Usage

### Development

```bash
npm run dev:scheduled
```

### Deployment

```bash
# Deploy to Cloudflare Workers
npm run deploy
```

## Environment Variables

The project uses a `.dev.vars` file to manage local development environment variables. When deploying to production, ensure these environment variables are properly set in the Cloudflare Workers console.

### Required Environment Variables

#### Tianji Configuration
- `BASE_URL`: Base URL for Tianji API
- `API_KEY`: Tianji API key
- `WORKSPACE_ID`: Workspace ID, can be found in workspace information
- `SURVEY_ID`: Tianji Survey ID
- `PAYLOAD_CONTENT_FIELD`: Field name for the main survey content (target for classification and translation)
- `LANGUAGE`: Language setting, e.g., 'en', helps Tianji AI generate results in the corresponding language

#### Feishu Configuration (Optional)
- `FEISHU_WEBHOOK`: Feishu bot webhook URL
- `FEISHU_APP_ID`: Feishu application ID
- `FEISHU_APP_SECRET`: Feishu application secret
- `FEISHU_TABLE_APPTOKEN`: Feishu multi-dimensional table AppToken
- `FEISHU_TABLE_ID`: Feishu multi-dimensional table ID

### Local Development

1. Create a `.dev.vars` file in the project root directory
2. Copy the above environment variables and fill in their respective values

### Production Environment

In the Cloudflare Workers console, configure the same environment variables. Ensure all required environment variables are properly set.

## Project Structure

- `src/` - Source code directory
- `wrangler.jsonc` - Cloudflare Workers configuration file
- `worker-configuration.d.ts` - Workers type definition file

## Tech Stack

- [Cloudflare Workers](https://workers.cloudflare.com/)
- [TypeScript](https://www.typescriptlang.org/)
- [Vitest](https://vitest.dev/)
- [dayjs](https://day.js.org/)
- [tianji-client-sdk](https://github.com/msgbyte/tianji)
