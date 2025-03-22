---
sidebar_position: 1
_i18n_hash: ae151f338aa838eaab15a19bfea78d7f
---
# 应用程序追踪

Tianji 提供了一个强大的 SDK 用于在您的应用程序中追踪事件和用户行为。本指南解释了如何在项目中集成和使用应用程序追踪 SDK。

## 安装

在您的项目中安装 Tianji React Native SDK：

```bash
npm install tianji-react-native
# 或者
yarn add tianji-react-native
# 或者
pnpm add tianji-react-native
```

## 初始化

在使用任何追踪功能之前，您需要使用您的 Tianji 服务器 URL 和应用程序 ID 来初始化应用程序 SDK：

```ts
import { initApplication } from 'tianji-react-native';

initApplication({
  serverUrl: 'https://tianji.example.com',  // 您的 Tianji 服务器 URL
  applicationId: 'your-application-id'       // 您的应用程序标识符
});
```

## 追踪事件

您可以在应用程序中追踪自定义事件以监控用户操作和行为：

```ts
import { reportApplicationEvent } from 'tianji-react-native';

// 追踪简单事件
reportApplicationEvent('Button Clicked');

// 追踪带有附加数据的事件
reportApplicationEvent('Purchase Completed', {
  productId: 'product-123',
  price: 29.99,
  currency: 'USD'
});
```

## 屏幕追踪

在您的应用程序中追踪屏幕视图以了解用户导航模式：

### 设置当前屏幕

您可以设置将在后续事件中包含的当前屏幕信息：

```ts
import { updateCurrentApplicationScreen } from 'tianji-react-native';

// 当用户导航时更新当前屏幕
updateCurrentApplicationScreen('ProductDetails', { productId: 'product-123' });
```

### 报告屏幕视图

显式报告屏幕视图事件：

```ts
import { reportApplicationScreenView } from 'tianji-react-native';

// 报告当前屏幕视图
reportApplicationScreenView();

// 或者报告特定屏幕视图
reportApplicationScreenView('Checkout', { cartItems: 3 });
```

## 用户识别

在您的应用程序中识别用户，以便跨会话追踪其行为：

```ts
import { identifyApplicationUser } from 'tianji-react-native';

// 使用用户信息识别用户
identifyApplicationUser({
  id: 'user-123',          // 唯一用户标识符
  email: 'user@example.com',
  name: 'John Doe',
  // 添加其他用户属性
  plan: 'premium',
  signupDate: '2023-01-15'
});
```

## API 参考

### `initApplication(options)`

初始化应用程序追踪 SDK。

**参数：**

- `options`: ApplicationTrackingOptions
  - `serverUrl`: 您的 Tianji 服务器 URL (例如，'https://tianji.example.com')
  - `applicationId`: 您的应用程序标识符

### `reportApplicationEvent(eventName, eventData?, screenName?, screenParams?)`

向 Tianji 服务器发送一个应用程序事件。

**参数：**

- `eventName`: 事件名称（最多 50 个字符）
- `eventData`: (可选) 事件数据对象
- `screenName`: (可选) 用于覆盖当前屏幕的屏幕名称
- `screenParams`: (可选) 用于覆盖当前屏幕参数的屏幕参数

### `updateCurrentApplicationScreen(name, params)`

更新当前应用程序屏幕信息。

**参数：**

- `name`: 屏幕名称
- `params`: 屏幕参数对象

### `reportApplicationScreenView(screenName?, screenParams?)`

向 Tianji 服务器发送屏幕视图事件。

**参数：**

- `screenName`: (可选) 用于覆盖当前屏幕的屏幕名称
- `screenParams`: (可选) 用于覆盖当前屏幕参数的屏幕参数

### `identifyApplicationUser(userInfo)`

在应用程序中识别用户。

**参数：**

- `userInfo`: 用户识别数据对象

## 负载限制

- 语言信息：最多 35 个字符
- 操作系统信息：最多 20 个字符
- URL 信息：最多 500 个字符
- 事件名称：最多 50 个字符
