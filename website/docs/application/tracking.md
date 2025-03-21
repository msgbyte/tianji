---
sidebar_position: 1
---

# Application Tracking

Tianji provides a powerful SDK for tracking events and user behavior in your applications. This guide explains how to integrate and use the Application Tracking SDK in your projects.

## Installation

Install the Tianji react native SDK in your project:

```bash
npm install tianji-react-native
# or
yarn add tianji-react-native
# or
pnpm add tianji-react-native
```

## Initialization

Before using any tracking features, you need to initialize the Application SDK with your Tianji server URL and application ID:

```ts
import { initApplication } from 'tianji-react-native';

initApplication({
  serverUrl: 'https://tianji.example.com',  // Your Tianji server URL
  applicationId: 'your-application-id'       // Your application identifier
});
```

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

## API Reference

### `initApplication(options)`

Initializes the application tracking SDK.

**Parameters:**

- `options`: ApplicationTrackingOptions
  - `serverUrl`: Your Tianji server URL (e.g., 'https://tianji.example.com')
  - `applicationId`: Your application identifier

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

## Payload Limitations

- Language information: max 35 characters
- Operating system information: max 20 characters
- URL information: max 500 characters
- Event name: max 50 characters
