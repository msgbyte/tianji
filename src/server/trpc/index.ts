import * as trpcExpress from '@trpc/server/adapters/express';
import { createContext } from './trpc.js';
import { appRouter } from './routers/index.js';
import {
  generateOpenApiDocument,
  createOpenApiExpressMiddleware,
} from 'trpc-to-openapi';
const packageJson = await import('../../../package.json', {
  with: { type: 'json' },
});

export type { inferRouterInputs, inferRouterOutputs } from '@trpc/server';

export const trpcExpressMiddleware = trpcExpress.createExpressMiddleware({
  router: appRouter,
  createContext,
  onError: ({ path, error }) => {
    console.error('Error:', path, error);
  },
});

export const trpcOpenapiHttpHandler = createOpenApiExpressMiddleware({
  router: appRouter,
  createContext,
});

const title = 'Tianji OpenAPI';

const description = `
## Tianji - All-in-One Insight Hub

**Tianji** is a comprehensive, **open-source** monitoring and analytics platform designed for independent developers and small teams. It combines multiple essential tools into one lightweight solution.

> **Getting Started:** Visit our official website at [tianji.dev](https://tianji.dev/) for complete documentation, tutorials, and deployment guides.

### Core Features

- **Website Analytics** - Track website visitors without cookies (GDPR/CCPA compliant)
- **Uptime Monitor** - Monitor your services 24/7 with alerts
- **Server Status** - Real-time server metrics and performance monitoring
- **Docker Status** - Monitor Docker containers and services
- **Status Page** - Public status pages for your services
- **Telemetry** - Collect telemetry data from distributed systems
- **Survey** - User feedback and satisfaction surveys
- **Feeds** - Event streams and notification management
- **Short Link** - URL shortener with analytics
- **AI Gateway** - AI model proxy with cost tracking

### Why Tianji?

- **Open Source** - Apache 2.0 License, free forever
- **Privacy First** - GDPR & CCPA compliant, no cookie tracking
- **All-in-One** - Multiple tools in one lightweight platform
- **Self-Hosted** - Full control over your data
- **Community Driven** - Active community and continuous improvements

### Authentication

The Tianji API uses **Bearer Token** authentication. Include your API key in the Authorization header:

\`\`\`
Authorization: Bearer <YOUR_API_KEY>
\`\`\`

**How to obtain an API key:**

1. Log in to your Tianji instance
2. Click on your avatar in the top right corner
3. Navigate to **Settings → API Keys**
4. Click the + button to create a new API key
5. Name your key and save it securely

For detailed authentication instructions and code examples, see the [Authentication Documentation](https://tianji.dev/docs/api/authentication).

### Resources

- **Website:** [tianji.dev](https://tianji.dev/)
- **GitHub:** [github.com/msgbyte/tianji](https://github.com/msgbyte/tianji)
- **Community:** [Join our Discord](https://discord.gg/8Vv47wAEej)
- **Cloud:** [Try Tianji Cloud](https://tianji.msgbyte.com/)

---

**Note:** This OpenAPI documentation provides programmatic access to all Tianji features. For detailed usage instructions, examples, and best practices, please visit our [official website](https://tianji.dev/).
`.trim();

export const trpcOpenapiDocument = generateOpenApiDocument(appRouter, {
  title,
  description,
  version: `v${packageJson.default.version}`,
  baseUrl: '/open',
});
