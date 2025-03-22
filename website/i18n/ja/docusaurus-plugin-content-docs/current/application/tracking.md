---
sidebar_position: 1
_i18n_hash: ae151f338aa838eaab15a19bfea78d7f
---
# アプリケーショントラッキング

Tianjiは、アプリケーション内のイベントやユーザーの行動を追跡するための強力なSDKを提供しています。このガイドでは、プロジェクトにApplication Tracking SDKを統合して使用する方法を説明します。

## インストール

プロジェクトにTianjiのReact Native SDKをインストールします：

```bash
npm install tianji-react-native
# または
yarn add tianji-react-native
# または
pnpm add tianji-react-native
```

## 初期化

トラッキング機能を使用する前に、TianjiのサーバーURLとアプリケーションIDでApplication SDKを初期化する必要があります：

```ts
import { initApplication } from 'tianji-react-native';

initApplication({
  serverUrl: 'https://tianji.example.com',  // TianjiサーバーのURL
  applicationId: 'your-application-id'       // アプリケーション識別子
});
```

## イベントトラッキング

アプリケーション内でカスタムイベントをトラッキングし、ユーザーの行動を監視できます：

```ts
import { reportApplicationEvent } from 'tianji-react-native';

// シンプルなイベントをトラッキング
reportApplicationEvent('Button Clicked');

// 追加データと一緒にイベントをトラッキング
reportApplicationEvent('Purchase Completed', {
  productId: 'product-123',
  price: 29.99,
  currency: 'USD'
});
```

## 画面トラッキング

アプリケーション内で画面遷移をトラッキングし、ユーザーのナビゲーションパターンを理解します：

### 現在の画面の設定

ユーザーが移動した際に、以降のイベントに含まれる現在の画面情報を設定できます：

```ts
import { updateCurrentApplicationScreen } from 'tianji-react-native';

// ユーザーのナビゲーション時に現在の画面を更新
updateCurrentApplicationScreen('ProductDetails', { productId: 'product-123' });
```

### 画面ビューの報告

明示的に画面ビューイベントを報告します：

```ts
import { reportApplicationScreenView } from 'tianji-react-native';

// 現在の画面ビューを報告
reportApplicationScreenView();

// 特定の画面ビューを報告
reportApplicationScreenView('Checkout', { cartItems: 3 });
```

## ユーザー識別

アプリケーション内でユーザーを識別し、セッションを超えた行動を追跡します：

```ts
import { identifyApplicationUser } from 'tianji-react-native';

// ユーザー情報で識別
identifyApplicationUser({
  id: 'user-123',          // ユーザーの一意識別子
  email: 'user@example.com',
  name: 'John Doe',
  // その他のユーザー属性を追加
  plan: 'premium',
  signupDate: '2023-01-15'
});
```

## APIリファレンス

### `initApplication(options)`

アプリケーショントラッキングSDKを初期化します。

**パラメータ:**

- `options`: ApplicationTrackingOptions
  - `serverUrl`: TianjiサーバーURL（例：'https://tianji.example.com'）
  - `applicationId`: アプリケーション識別子

### `reportApplicationEvent(eventName, eventData?, screenName?, screenParams?)`

アプリケーションイベントをTianjiサーバーに送信します。

**パラメータ:**

- `eventName`: イベント名（最大50文字）
- `eventData`: （オプション）イベントデータオブジェクト
- `screenName`: （オプション）現在の画面を上書きするための画面名
- `screenParams`: （オプション）現在の画面パラメータを上書きするための画面パラメータ

### `updateCurrentApplicationScreen(name, params)`

現在のアプリケーション画面情報を更新します。

**パラメータ:**

- `name`: 画面名
- `params`: 画面パラメータオブジェクト

### `reportApplicationScreenView(screenName?, screenParams?)`

画面ビューイベントをTianjiサーバーに送信します。

**パラメータ:**

- `screenName`: （オプション）現在の画面を上書きするための画面名
- `screenParams`: （オプション）現在の画面パラメータを上書きするための画面パラメータ

### `identifyApplicationUser(userInfo)`

アプリケーション内でユーザーを識別します。

**パラメータ:**

- `userInfo`: ユーザー識別データオブジェクト

## ペイロード制限

- 言語情報: 最大35文字
- オペレーティングシステム情報: 最大20文字
- URL情報: 最大500文字
- イベント名: 最大50文字
