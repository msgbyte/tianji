---
sidebar_position: 1
_i18n_hash: 21ae6837de110e1b576fdf570bbbea6c
---
# トラッカースクリプト

## インストール

ウェブサイトのイベントを追跡するには、シンプルなスクリプト（< 2 KB）をウェブサイトに注入するだけで十分です。

スクリプトは以下のように見えます：

```html
<script async defer src="https://<your-self-hosted-domain>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

このスクリプトコードは**天機（Tianji）**のウェブサイトリストから入手可能です。

## スクリプト属性

トラッカースクリプトは、`<script>`タグ上の以下の`data-*`属性をサポートしています：

| 属性 | 必須 | デフォルト | 説明 |
|---|---|---|---|
| `data-website-id` | **はい** | — | トラッキングデータを関連付けるためのユニークなウェブサイトIDです。トラッカーはこれがないと初期化されません。 |
| `data-host-url` | いいえ | Script `src`のオリジン | バックエンドサーバーのURL。省略された場合、スクリプトの`src`パスから自動的に導出されます。 |
| `data-auto-track` | いいえ | `true` | ページビューとルート変更を自動的に追跡します。無効にするには`"false"`に設定します。 |
| `data-do-not-track` | いいえ | — | 設定されると、ブラウザのDo Not Track（DNT）設定を尊重し、DNTが有効な場合トラッキングを無効にします。 |
| `data-domains` | いいえ | — | トラッキングするドメインのカンマ区切りリスト（例："example.com,www.example.com"）。これらのドメインと現在のホスト名が一致する場合のみトラッキングが有効になります。 |

### フル例

```html
<script
  async
  defer
  src="https://example.com/tracker.js"
  data-website-id="clxxxxxxxxxxxxxxxxxx"
  data-host-url="https://analytics.example.com"
  data-auto-track="true"
  data-do-not-track="true"
  data-domains="example.com,www.example.com"
></script>
```

### localStorageによるトラッキングの無効化

localStorageフラグを設定することで、ランタイムでトラッキングを無効にすることもできます：

```javascript
localStorage.setItem('tianji.disabled', '1');
```

## イベント報告

**天機（Tianji）**では、ユーザーのクリックイベントを報告するための簡単な方法を提供しています。これは、ユーザーがどのアクションを好み、頻繁に使用するかを追跡するのに役立ちます。

これはウェブサイト解析で非常に一般的な方法です。**天機**を使うとすぐに利用可能です。

### 基本的な使い方

ウェブサイトにスクリプトコードを注入した後、DOM属性に`data-tianji-event`を追加するだけです。

例：

```html
<button data-tianji-event="submit-login-form">Login</button>
```

このボタンをユーザーがクリックすると、ダッシュボードに新しいイベントが届きます。

### イベントデータの添付

`data-tianji-event-{key}`属性を使用してイベントに追加データを添付できます。このパターンに一致する属性はすべて収集され、イベントとともに送信されます。

```html
<button 
  data-tianji-event="purchase" 
  data-tianji-event-product="Premium Plan"
  data-tianji-event-price="99"
  data-tianji-event-currency="USD">
  Buy Now
</button>
```

これは以下のデータとともに`purchase`という名前のイベントを送信します：
```json
{
  "product": "Premium Plan",
  "price": "99",
  "currency": "USD"
}
```

### リンククリックの追跡

`<a>`タグで`data-tianji-event`を使用する場合、**天機**はナビゲーションの前にイベントが追跡されるよう特別に処理します：

```html
<a href="/pricing" data-tianji-event="view-pricing">Check Pricing</a>
```

内部リンク（新しいタブで開かない）は以下のように処理されます：
1. デフォルトのナビゲーションを防ぐ
2. トラッキングイベントを送信
3. トラッキング完了後、ターゲットURLにナビゲート

外部リンクまたは`target="_blank"`を持つリンクの場合、ナビゲーションをブロックせずにイベントが追跡されます。

### JavaScript API

トラッカースクリプトがロードされた後、`window.tianji`オブジェクトを使用してプログラム的にイベントを追跡することもできます。

#### カスタムイベントの追跡

```javascript
// シンプルなイベントトラッキング
window.tianji.track('button-clicked');

// カスタムデータ付きイベント
window.tianji.track('purchase', {
  product: 'Premium Plan',
  price: 99,
  currency: 'USD'
});

// カスタムペイロードオブジェクトを使用した追跡
window.tianji.track({
  website: 'your-website-id',
  name: 'custom-event',
  data: { key: 'value' }
});

// 関数を使った追跡（現在のページ情報を受け取る）
window.tianji.track((payload) => ({
  ...payload,
  name: 'dynamic-event',
  data: { timestamp: Date.now() }
}));
```

#### ユーザーの識別

トラッキングセッションにユーザー情報を添付できます：

```javascript
window.tianji.identify({
  userId: 'user-123',
  email: 'user@example.com',
  plan: 'premium'
});
```

この情報は、このユーザーからの後続のイベントに関連付けられます。

## デフォルトスクリプト名の変更

> この機能はv1.7.4+で利用可能です。

起動時に`CUSTOM_TRACKER_SCRIPT_NAME`環境変数を使用できます。

例：
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

この場合、トラッカースクリプトは`"https://<your-self-hosted-domain>/my-tracker.js"`からアクセスできるようになります。

これにより、一部の広告ブロッカーを避けることができます。

`.js`のサフィックスは必要ありません。任意のパスを選択できますし、`CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"`のように設定することも可能です。

## 特定のドメインのみのトラッキング

通常、トラッカーはサイトが動作しているすべての場所のイベントを報告しますが、`localhost`のようなイベントを無視する必要がある場合があります。

天機はトラッカースクリプトにそのための属性を提供しています。

スクリプトに`data-domains`を追加できます。値はトラッキングするルートドメインである必要があります。複数のドメインは`，`で区切ります。

```html
<script async defer src="https://<your-self-hosted-domain>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

これにより、これらのドメインからのイベントのみが表示されるようになります。
