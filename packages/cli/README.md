# Tianji CLI

Command-line tool for developing and deploying Tianji Workers.

## Installation

### From Source (Development)

```bash
# In the Tianji monorepo root
pnpm install
cd packages/cli
pnpm build

# Link globally for development
pnpm link --global
```

### From NPM (When Published)

```bash
npm install -g tianji-cli
# or
pnpm add -g tianji-cli
```

## Usage

### Login to Tianji

Before deploying workers, you need to login to your Tianji instance:

```bash
tianji login
```

You will be prompted for:
- **Server URL**: Your Tianji server URL (e.g., `https://tianji.example.com`)
- **Workspace ID**: Your workspace ID (found in Tianji dashboard)
- **API Key**: Your API key (generate from Tianji settings)

The credentials are saved to `~/.config/tianji/config.json`.

### Create a New Worker Project

```bash
# Create in a new directory
tianji worker init my-worker

# Or initialize in current directory
mkdir my-worker && cd my-worker
tianji worker init
```

This creates a new project with:
- `src/index.ts`: Worker handler function
- `vite.config.ts`: Build configuration
- `package.json`: Dependencies
- `.tianjirc`: Project configuration

### Develop Your Worker

Edit `src/index.ts` to implement your worker logic:

```typescript
export default async function handler(payload: any, context: any) {
  // Your worker logic here
  return {
    success: true,
    message: 'Hello from Tianji Worker!',
    data: payload,
  };
}
```

### Build and Deploy

```bash
# Login first (if not already logged in)
tianji login

# Install dependencies (first time only)
npm install

# Build the worker
npm run build

# Deploy to Tianji
tianji worker deploy
```

The worker will be built using Vite and deployed to your Tianji instance. After deployment, you'll receive a URL to access your worker.

## Project Structure

```
my-worker/
├── src/
│   └── index.ts          # Worker entry point
├── dist/                 # Built output (generated)
├── package.json          # Project dependencies
├── vite.config.ts        # Vite build configuration
├── tsconfig.json         # TypeScript configuration
├── .tianjirc             # Tianji project config
└── README.md             # Project documentation
```

## Worker API

Your worker receives two parameters:

### `payload`

The request payload containing query parameters and request body merged together.

### `context`

The request context with the following structure:

```typescript
interface RequestContext {
  type: 'http' | 'cron';
  request?: {
    method: string;
    url: string;
    headers: Record<string, string>;
  };
}
```

- For HTTP requests: `context.type === 'http'` and `context.request` contains request details
- For cron-triggered workers: `context.type === 'cron'`

## Configuration Files

### `.tianjirc`

Project-level configuration stored in your worker project:

```json
{
  "name": "my-worker",
  "workerId": "clxxx..." // Auto-generated after first deployment
}
```

### `~/.config/tianji/config.json`

Global configuration for CLI authentication:

```json
{
  "serverUrl": "https://tianji.example.com",
  "workspaceId": "clxxx...",
  "apiKey": "your-api-key"
}
```

## Commands

### `tianji login`

Login to Tianji and save credentials.

### `tianji worker init [project-name]`

Create a new Tianji Worker project.

**Options:**
- `project-name`: Optional. Name of the project directory to create.

### `tianji worker deploy`

Build and deploy the current worker project to Tianji.

Must be run from a worker project directory (containing `.tianjirc`).

## Examples

### Simple Echo Worker

```typescript
export default async function handler(payload: any) {
  return {
    echo: payload,
    timestamp: new Date().toISOString(),
  };
}
```

### HTTP Method-Based Worker

```typescript
export default async function handler(payload: any, context: any) {
  if (context.type !== 'http') {
    return { error: 'Only HTTP requests supported' };
  }

  const method = context.request?.method;
  
  switch (method) {
    case 'GET':
      return { message: 'Hello GET' };
    case 'POST':
      return { message: 'Data received', data: payload };
    default:
      return { error: 'Method not supported' };
  }
}
```

### Cron Worker

```typescript
export default async function handler(payload: any, context: any) {
  if (context.type === 'cron') {
    // Perform scheduled task
    console.log('Cron job executed at:', new Date().toISOString());
    return { success: true };
  }
  
  return { error: 'This worker only runs on schedule' };
}
```

## Troubleshooting

### "Not logged in" Error

Run `tianji login` to authenticate.

### ".tianjirc not found" Error

Make sure you're in a worker project directory. Run `tianji worker init` to create a new project.

### "Build failed" Error

Ensure all dependencies are installed:
```bash
npm install
```

Check that your `src/index.ts` has a default export function.

### "Deployment failed" Error

- Verify your credentials are correct (try logging in again)
- Check that your API key has the necessary permissions
- Ensure your server URL is accessible

## Learn More

- [Tianji Documentation](https://tianji.msgbyte.com/docs)
- [Worker Documentation](https://tianji.msgbyte.com/docs/dev)

## License

MIT
