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
<div style="font-family: system-ui, -apple-system, sans-serif; line-height: 1.6;">
  <h2>Tianji - All-in-One Insight Hub</h2>

  <p>
    <strong>Tianji</strong> is a comprehensive, <strong>open-source</strong> monitoring and analytics platform
    designed for independent developers and small teams. It combines multiple essential tools into one lightweight solution.
  </p>

  <div style="background: #f6f8fa; padding: 12px; border-radius: 6px; margin: 16px 0;">
    <strong>Getting Started:</strong> Visit our official website at
    <a href="https://tianji.dev/" target="_blank" style="color: #0969da; font-weight: 600;">tianji.dev</a>
    for complete documentation, tutorials, and deployment guides.
  </div>

  <h3>Core Features</h3>
  <ul>
    <li><strong>Website Analytics</strong> - Track website visitors without cookies (GDPR/CCPA compliant)</li>
    <li><strong>Uptime Monitor</strong> - Monitor your services 24/7 with alerts</li>
    <li><strong>Server Status</strong> - Real-time server metrics and performance monitoring</li>
    <li><strong>Docker Status</strong> - Monitor Docker containers and services</li>
    <li><strong>Status Page</strong> - Public status pages for your services</li>
    <li><strong>Telemetry</strong> - Collect telemetry data from distributed systems</li>
    <li><strong>Survey</strong> - User feedback and satisfaction surveys</li>
    <li><strong>Feeds</strong> - Event streams and notification management</li>
    <li><strong>Short Link</strong> - URL shortener with analytics</li>
    <li><strong>AI Gateway</strong> - AI model proxy with cost tracking</li>
  </ul>

  <h3>Why Tianji?</h3>
  <ul>
    <li><strong>Open Source</strong> - Apache 2.0 License, free forever</li>
    <li><strong>Privacy First</strong> - GDPR & CCPA compliant, no cookie tracking</li>
    <li><strong>All-in-One</strong> - Multiple tools in one lightweight platform</li>
    <li><strong>Self-Hosted</strong> - Full control over your data</li>
    <li><strong>Community Driven</strong> - Active community and continuous improvements</li>
  </ul>

  <h3>Authentication</h3>
  <p>
    The Tianji API uses <strong>Bearer Token</strong> authentication. Include your API key in the Authorization header:
  </p>
  <pre style="background: #f6f8fa; padding: 12px; border-radius: 6px; overflow-x: auto;">Authorization: Bearer &lt;YOUR_API_KEY&gt;</pre>

  <p><strong>How to obtain an API key:</strong></p>
  <ol>
    <li>Log in to your Tianji instance</li>
    <li>Click on your avatar in the top right corner</li>
    <li>Navigate to <strong>Settings → API Keys</strong></li>
    <li>Click the + button to create a new API key</li>
    <li>Name your key and save it securely</li>
  </ol>

  <p style="margin-top: 12px;">
    For detailed authentication instructions and code examples, see the
    <a href="https://tianji.dev/docs/api/authentication" target="_blank" style="color: #0969da;">Authentication Documentation</a>.
  </p>

  <h3>Resources</h3>
  <ul>
    <li><strong>Website:</strong> <a href="https://tianji.dev/" target="_blank">tianji.dev</a></li>
    <li><strong>GitHub:</strong> <a href="https://github.com/msgbyte/tianji" target="_blank">github.com/msgbyte/tianji</a></li>
    <li><strong>Community:</strong> <a href="https://discord.gg/8Vv47wAEej" target="_blank">Join our Discord</a></li>
    <li><strong>Cloud:</strong> <a href="https://tianji.msgbyte.com/" target="_blank">Try Tianji Cloud</a></li>
  </ul>

  <hr style="margin: 24px 0; border: none; border-top: 1px solid #d0d7de;">

  <p style="color: #57606a; font-size: 0.9em;">
    <strong>Note:</strong> This OpenAPI documentation provides programmatic access to all Tianji features.
    For detailed usage instructions, examples, and best practices, please visit our
    <a href="https://tianji.dev/" target="_blank" style="color: #0969da;">official website</a>.
  </p>
</div>
`.trim();

export const trpcOpenapiDocument = generateOpenApiDocument(appRouter, {
  title,
  description,
  version: `v${packageJson.default.version}`,
  baseUrl: '/open',
});
