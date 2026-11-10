---
sidebar_position: 1
---

# Application Tracking

Tianji provides a powerful SDK for tracking events and user behavior in your applications. This guide explains how to integrate and use the Application Tracking SDK in your projects.

## Quick Integration with AI Agent

Open your application in Tianji and click **Usage** in the top right corner. The **AI Prompt** tab contains a prompt with your server URL and application ID already filled in. Paste it into your coding agent (Claude Code, Cursor, Codex, etc.) and it will install the SDK, initialize it, and add screen, user, and event tracking for you.

You can also write the prompt yourself:

```text
Integrate Tianji application tracking into this project.

Tianji server URL: https://tianji.example.com
Application ID: your-application-id
Documentation: https://tianji.dev/docs/application/tracking

Install the SDK, initialize it at app startup, report screen views on
navigation, identify the user after sign in, report API requests and
uncaught errors, flush events when the app goes to the background, and
propose key business events for me to approve before tracking them.
```

## Installation

Install the Tianji React Native SDK and its peer dependency [`react-native-device-info`](https://github.com/react-native-device-info/react-native-device-info) in your project:

```bash
npm install tianji-react-native react-native-device-info
# or
yarn add tianji-react-native react-native-device-info
# or
pnpm add tianji-react-native react-native-device-info
```

`react-native-device-info` is a native module, so Expo projects need a [development build](https://docs.expo.dev/develop/development-builds/introduction/) (or `expo prebuild`); importing it in Expo Go crashes the app.

In Expo Go and other JavaScript runtimes, install `tianji-client-sdk` instead. It exposes the same API, but `initApplication` does not report the OS and app version automatically; call `identifyApplicationUser({ os, osVersion, version })` yourself after initialization. For other platforms (Flutter, native iOS/Android, etc.), use the [HTTP API](#http-api).

## Initialization

Before using any tracking features, you need to initialize the Application SDK with your Tianji server URL and application ID:

```ts
import { initApplication } from 'tianji-react-native';

initApplication({
  serverUrl: 'https://tianji.example.com',  // Your Tianji server URL
  applicationId: 'your-application-id'       // Your application identifier
});
```

You can find the server URL and application ID in the **Usage** dialog of your application in Tianji. Make sure the server URL is reachable from real devices: not `localhost`, and HTTPS unless your app allows cleartext traffic.

Events are sent in batches by default. Use `batchDelay` (default `200` ms) to change the batch window, or `disableBatch: true` to send each event immediately.

## Operating System Version

The React Native SDK automatically records `os` and `osVersion` at initialization. `osVersion` is the operating system release (for example, `"14"` for Android 14), while `version` remains the application version.

When using `tianji-client-sdk` directly, supply these values after initialization:

```ts
identifyApplicationUser({ os: 'android', osVersion: '14', version: '2.0.0' });
```

The SDK includes the OS metadata in subsequent events. For direct HTTP requests, include `os` and `osVersion` in the payload of each request. Omit `osVersion` when unavailable; existing records without a version remain unknown until the client reports one.

## Tracking Events

You can track custom events in your application to monitor user actions and behaviors:

```ts
import { reportApplicationEvent } from 'tianji-react-native';

// Track a simple event
reportApplicationEvent('Button Clicked');

// Track an event with additional data
reportApplicationEvent('Purchase Completed', {
  productId: 'product-123',
  price: 29.99,
  currency: 'USD'
});
```

## Screen Tracking

Track screen views in your application to understand user navigation patterns:

### Setting Current Screen

You can set the current screen information which will be included in subsequent events:

```ts
import { updateCurrentApplicationScreen } from 'tianji-react-native';

// Update current screen when user navigates
updateCurrentApplicationScreen('ProductDetails', { productId: 'product-123' });
```

### Reporting Screen Views

Explicitly report screen view events:

```ts
import { reportApplicationScreenView } from 'tianji-react-native';

// Report current screen view
reportApplicationScreenView();

// Or report a specific screen view
reportApplicationScreenView('Checkout', { cartItems: 3 });
```

#### Integrate with expo-router

Use the route pattern (for example `/product/[id]`) as the screen name. A resolved path such as `/product/123` would count every product as a different screen. Pass only the params you need: search params can contain tokens from deep links or OAuth callbacks.

```tsx
import { useEffect } from 'react'
import { usePathname, useSegments } from 'expo-router'
import { reportApplicationScreenView } from 'tianji-react-native'

function App() {
  const screen = '/' + useSegments().join('/')
  const pathname = usePathname() // changes on navigation, not on query updates

  useEffect(() => {
    // Always pass params: omitting them keeps the previous screen's params
    reportApplicationScreenView(screen, {})
  }, [screen, pathname])
}
```

#### Integrate with React Navigation

`onStateChange` also fires for changes that keep the same screen focused (for example `setParams` or opening a drawer), so report only when the focused route changes. As with expo-router, pass only the non-sensitive params you need:

```tsx
import { useRef } from 'react'
import { NavigationContainer, useNavigationContainerRef } from '@react-navigation/native'
import { reportApplicationScreenView } from 'tianji-react-native'

function App() {
  const navigationRef = useNavigationContainerRef()
  const routeKeyRef = useRef<string | undefined>(undefined)

  const reportCurrentScreen = () => {
    const route = navigationRef.getCurrentRoute()
    if (route && route.key !== routeKeyRef.current) {
      routeKeyRef.current = route.key
      reportApplicationScreenView(route.name, {})
    }
  }

  return (
    <NavigationContainer
      ref={navigationRef}
      onReady={reportCurrentScreen}
      onStateChange={reportCurrentScreen}
    >
      {/* ... */}
    </NavigationContainer>
  )
}
```

## User Identification

Identify users in your application to track their behavior across sessions:

```ts
import { identifyApplicationUser } from 'tianji-react-native';

// Identify a user with their information
identifyApplicationUser({
  id: 'user-123',          // Unique user identifier
  email: 'user@example.com',
  name: 'John Doe',
  // Add any other user properties
  plan: 'premium',
  signupDate: '2023-01-15'
});
```

## Common Scenarios

Use a fixed name for each kind of event and put the variable parts in the event data. The dashboard groups events by name, so a name like `GET /users/123` would split one metric into thousands. Never include passwords, tokens, request bodies, or other secrets in event data.

### API Request Monitoring

The SDK does not capture network requests automatically. Report them from your app's own API client instead of patching the global `fetch`: the SDK sends its events with `fetch` too, so a global patch would report its own requests in a loop.

With a `fetch` wrapper:

```ts
import { reportApplicationEvent } from 'tianji-react-native';

export async function apiFetch(url: string, init?: RequestInit) {
  const startAt = Date.now();
  // Tracking must never break the request
  const report = (name: string, data: Record<string, unknown>) => {
    try {
      reportApplicationEvent(name, {
        method: (init?.method ?? 'GET').toUpperCase(),
        path: String(url).split('?')[0].slice(0, 500), // query strings may contain tokens
        duration: Date.now() - startAt,
        ...data,
      }).catch(() => {});
    } catch {}
  };

  try {
    const response = await fetch(url, init);
    report('API Request', { status: response.status });
    return response;
  } catch (error) {
    if (!(error instanceof Error && error.name === 'AbortError')) {
      report('API Request Failed', { message: String(error).slice(0, 500) });
    }
    throw error;
  }
}
```

With axios interceptors:

```ts
import axios, { InternalAxiosRequestConfig } from 'axios';
import { reportApplicationEvent } from 'tianji-react-native';

export const api = axios.create({ baseURL: 'https://api.example.com' });

// Stored on the config itself so it survives interceptors that copy the config
type TimedConfig = InternalAxiosRequestConfig & { startAt?: number };

function reportRequest(config?: TimedConfig, status?: number) {
  if (!config?.startAt) {
    return;
  }

  reportApplicationEvent(status ? 'API Request' : 'API Request Failed', {
    method: (config.method ?? 'get').toUpperCase(),
    path: config.url?.split('?')[0].slice(0, 500),
    status,
    duration: Date.now() - config.startAt,
  });
}

api.interceptors.request.use((config: TimedConfig) => {
  config.startAt = Date.now();
  return config;
});

api.interceptors.response.use(
  (response) => {
    reportRequest(response.config, response.status);
    return response;
  },
  (error) => {
    if (!axios.isCancel(error)) {
      reportRequest(error.config, error.response?.status);
    }
    return Promise.reject(error);
  }
);
```

For high-traffic apps, report only failed (`status >= 400`) or slow requests.

### Error Tracking

Report uncaught JavaScript errors with the React Native global handler. Wrap the tracking code in `try/finally` so the default handler always runs:

```ts
import { reportApplicationEvent, flushApplicationBatchQueue } from 'tianji-react-native';

const defaultHandler = ErrorUtils.getGlobalHandler();

ErrorUtils.setGlobalHandler((error, isFatal) => {
  try {
    reportApplicationEvent('App Error', {
      name: String(error?.name ?? 'Error').slice(0, 500),
      message: String(error?.message ?? error).slice(0, 500),
      isFatal: Boolean(isFatal),
    });
    flushApplicationBatchQueue();
  } finally {
    defaultHandler(error, isFatal);
  }
});
```

Run this once at app startup from a module that rarely changes; Fast Refresh re-runs edited modules and would wrap the handler again. Fatal errors may close the app before the event is sent, so this is best effort. For render errors, call `reportApplicationEvent('App Error', ...)` from an error boundary's `componentDidCatch`. Native crashes are not covered.

### App Lifecycle

Batched events are kept in memory for a short time. Flush them when the app moves to the background so they are not lost. On iOS, the app also briefly becomes `inactive` (Control Center, system prompts), so report a foreground event only when it returns from `background`:

```ts
import { AppState } from 'react-native';
import { reportApplicationEvent, flushApplicationBatchQueue } from 'tianji-react-native';

let wasInBackground = false;

AppState.addEventListener('change', (state) => {
  if (state === 'background') {
    wasInBackground = true;
    reportApplicationEvent('App Background');
    flushApplicationBatchQueue();
  }

  if (state === 'active' && wasInBackground) {
    wasInBackground = false;
    reportApplicationEvent('App Foreground');
  }
});
```

## HTTP API

Platforms without an SDK can send events directly. No authentication is required; the application ID identifies the target.

```bash
curl -X POST 'https://tianji.example.com/api/application/send' \
  -H 'Content-Type: application/json' \
  -d '{
  "type": "event",
  "payload": {
    "application": "your-application-id",
    "name": "Button Clicked",
    "data": { "button": "signup" },
    "screen": "Home",
    "params": {},
    "os": "ios",
    "osVersion": "17.4.1",
    "language": "en-US"
  }
}'
```

- `type`: `event` or `identify`. An `identify` request stores `payload.data` as user information.
- A screen view is an `event` without `name`.
- Sessions are derived from the client IP and user agent.
- To send up to 100 events in one request, `POST /api/application/batch` with `{ "events": [{ "type": "event", "payload": { ... } }] }`. All events in a batch are stored under the application and session of the first event, so only batch events from one application on one device. If any event fails validation, the whole batch is rejected.

## API Reference

### `initApplication(options)`

Initializes the application tracking SDK.

**Parameters:**

- `options`: ApplicationTrackingOptions
  - `serverUrl`: Your Tianji server URL (e.g., 'https://tianji.example.com')
  - `applicationId`: Your application identifier
  - `batchDelay`: (Optional) Batch window in milliseconds, defaults to `200`
  - `disableBatch`: (Optional) Send each event immediately, defaults to `false`

### `reportApplicationEvent(eventName, eventData?, screenName?, screenParams?)`

Sends an application event to the Tianji server.

**Parameters:**

- `eventName`: Name of the event (max 50 chars)
- `eventData`: (Optional) Event data object
- `screenName`: (Optional) Screen name to override current screen
- `screenParams`: (Optional) Screen parameters to override current screen params

### `updateCurrentApplicationScreen(name, params)`

Updates the current application screen information.

**Parameters:**

- `name`: Screen name
- `params`: Screen parameters object

### `reportApplicationScreenView(screenName?, screenParams?)`

Sends a screen view event to the Tianji server.

**Parameters:**

- `screenName`: (Optional) Screen name to override current screen
- `screenParams`: (Optional) Screen parameters to override current screen params

### `identifyApplicationUser(userInfo)`

Identifies a user in the application.

**Parameters:**

- `userInfo`: User identification data object

### `flushApplicationBatchQueue()`

Sends all pending batched events immediately.

## Payload Limitations

- Language information: max 35 characters
- Operating system name and version: max 20 characters each; `osVersion` must be a string
- URL information: max 500 characters
- Screen name: max 500 characters
- Event name: max 50 characters
- Event data and user data string values: max 500 characters
