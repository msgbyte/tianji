---
sidebar_position: 1
_i18n_hash: fbe38264a49d1d3af45c4417fdc9a108
---
# アプリケーショントラッキング

Tianjiは、アプリケーション内のイベントやユーザー行動をトラッキングするための強力なSDKを提供しています。このガイドでは、アプリケーショントラッキングSDKをプロジェクトに統合して使用する方法を説明します。

## インストール

プロジェクトにTianjiのReact Native SDKをインストールします:

```bash
npm install tianji-react-native
# または
yarn add tianji-react-native
# または
pnpm add tianji-react-native
```

## 初期化

トラッキング機能を使用する前に、TianjiサーバーURLとアプリケーションIDを使用してアプリケーションSDKを初期化する必要があります:

```ts
import { initApplication } from 'tianji-react-native';

initApplication({
  serverUrl: 'https://tianji.example.com',  // TianjiサーバーのURL
  applicationId: 'your-application-id'       // アプリケーション識別子
});
```

## イベントトラッキング

アプリケーション内でカスタムイベントをトラッキングすることで、ユーザーの行動を監視できます:

```ts
import { reportApplicationEvent } from 'tianji-react-native';

// シンプルなイベントをトラッキング
reportApplicationEvent('Button Clicked');

// 追加データを伴うイベントをトラッキング
reportApplicationEvent('Purchase Completed', {
  productId: 'product-123',
  price: 29.99,
  currency: 'USD'
});
```

## スクリントラッキング

アプリケーション内のスクリーンビューをトラッキングして、ユーザーのナビゲーションパターンを理解します:

### 現在のスクリーン設定

後続のイベントに含まれる現在のスクリーン情報を設定できます:

```ts
import { updateCurrentApplicationScreen } from 'tianji-react-native';

// ユーザーがナビゲートした際に現在のスクリーンを更新
updateCurrentApplicationScreen('ProductDetails', { productId: 'product-123' });
```

### スクリーンビューの報告

スクリーンビューイベントを明示的に報告します:

```ts
import { reportApplicationScreenView } from 'tianji-react-native';

// 現在のスクリーンビューを報告
reportApplicationScreenView();

// または特定のスクリーンビューを報告
reportApplicationScreenView('Checkout', { cartItems: 3 });
```

#### expo-routerとの統合

```tsx
import { useGlobalSearchParams, usePathname } from 'expo-router'
import { reportApplicationScreenView } from 'tianji-react-native'

function App() {
  const pathname = usePathname()
  const params = useGlobalSearchParams()

  useEffect(() => {
    reportApplicationScreenView(pathname, params)
  }, [pathname, params])
}
```

## ユーザー識別

アプリケーション内のユーザーを識別し、セッションを超えた行動をトラッキングします:

```ts
import { identifyApplicationUser } from 'tianji-react-native';

// ユーザー情報でユーザーを識別
identifyApplicationUser({
  id: 'user-123',          // ユーザーの一意の識別子
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
  - `serverUrl`: TianjiサーバーURL（例: 'https://tianji.example.com'）
  - `applicationId`: アプリケーション識別子

### `reportApplicationEvent(eventName, eventData?, screenName?, screenParams?)`

アプリケーションイベントをTianjiサーバーに送信します。

**パラメータ:**

- `eventName`: イベント名（最大50文字）
- `eventData`: （オプション）イベントデータオブジェクト
- `screenName`: （オプション）現在のスクリーンをオーバーライドするスクリーン名
- `screenParams`: （オプション）現在のスクリーンパラメータをオーバーライドするスクリーンパラメータ

### `updateCurrentApplicationScreen(name, params)`

現在のアプリケーションスクリーン情報を更新します。

**パラメータ:**

- `name`: スクリーン名
- `params`: スクリーンパラメータオブジェクト

### `reportApplicationScreenView(screenName?, screenParams?)`

スクリーンビューイベントをTianjiサーバーに送信します。

**パラメータ:**

- `screenName`: （オプション）現在のスクリーンをオーバーライドするスクリーン名
- `screenParams`: （オプション）現在のスクリーンパラメータをオーバーライドするスクリーンパラメータ

### `identifyApplicationUser(userInfo)`

アプリケーション内でユーザーを識別します。

**パラメータ:**

- `userInfo`: ユーザー識別データオブジェクト

## ペイロード制限

- 言語情報: 最大35文字
- オペレーティングシステム情報: 最大20文字
- URL情報: 最大500文字
- イベント名: 最大50文字
