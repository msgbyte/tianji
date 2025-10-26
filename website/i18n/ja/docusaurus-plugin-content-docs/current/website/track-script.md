---
sidebar_position: 1
_i18n_hash: ef9fc0eb6072a8f037b70ff2b56e12ae
---
# トラッカースクリプト

## インストール

ウェブサイトのイベントをトラッキングするためには、ウェブサイトにシンプルなスクリプト（< 2 KB）を挿入するだけで構いません。

スクリプトは以下のようになります：

```html
<script async defer src="https://<あなたの自己ホストドメイン>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

このスクリプトコードは**Tianji**のウェブサイトリストから取得できます。

## イベント報告

**Tianji**はユーザのクリックイベントを報告するシンプルな方法を提供します。これはユーザがどのアクションを好み、頻繁に使用するかをトラッキングするのに役立ちます。

これはウェブサイト分析における非常に一般的な方法です。**Tianji**を使用して、迅速に利用することができます。

### 基本的な使い方

スクリプトコードをウェブサイトに挿入した後、DOM属性に`data-tianji-event`を追加するだけです。

例：

```html
<button data-tianji-event="submit-login-form">ログイン</button>
```

これで、ユーザがこのボタンをクリックすると、ダッシュボードに新しいイベントが受信されます。

### イベントデータの添付

`data-tianji-event-{key}`属性を使用してイベントに追加のデータを添付することができます。このパターンに一致する属性はすべて収集され、イベントと共に送信されます。

```html
<button 
  data-tianji-event="purchase" 
  data-tianji-event-product="Premium Plan"
  data-tianji-event-price="99"
  data-tianji-event-currency="USD">
  今すぐ購入
</button>
```

これは、以下のデータを持つ`purchase`という名前のイベントを送信します：
```json
{
  "product": "Premium Plan",
  "price": "99",
  "currency": "USD"
}
```

### リンクのクリックをトラッキング

アンカータグ (`<a>`) に`data-tianji-event`を使用する際、**Tianji**はナビゲーションが行われる前にイベントがトラッキングされるように特別に処理します：

```html
<a href="/pricing" data-tianji-event="view-pricing">料金を確認する</a>
```

内部リンク（新しいタブで開かないもの）の場合、トラッカーは以下を行います：
1. デフォルトのナビゲーションを防止
2. トラッキングイベントを送信
3. トラッキングが完了した後、ターゲットURLにナビゲート

外部リンクや`target="_blank"`のリンクの場合、ナビゲーションをブロックせずにイベントがトラッキングされます。

### JavaScript API

トラッカースクリプトが読み込まれた後、`window.tianji`オブジェクトを使用してプログラムによるイベントトラッキングも可能です。

#### カスタムイベントのトラッキング

```javascript
// シンプルなイベントトラッキング
window.tianji.track('button-clicked');

// カスタムデータを持つイベント
window.tianji.track('purchase', {
  product: 'Premium Plan',
  price: 99,
  currency: 'USD'
});

// カスタムペイロードオブジェクトでのトラッキング
window.tianji.track({
  website: 'your-website-id',
  name: 'custom-event',
  data: { key: 'value' }
});

// 関数を使用したトラッキング（現在のページ情報を受け取る）
window.tianji.track((payload) => ({
  ...payload,
  name: 'dynamic-event',
  data: { timestamp: Date.now() }
}));
```

#### ユーザの識別

トラッキングセッションにユーザ情報を添付できます：

```javascript
window.tianji.identify({
  userId: 'user-123',
  email: 'user@example.com',
  plan: 'premium'
});
```

この情報は、このユーザからの以降のイベントに関連付けられます。


## デフォルトスクリプト名の変更

> この機能はバージョン1.7.4+で利用可能です。

開始時に環境変数`CUSTOM_TRACKER_SCRIPT_NAME`を使用できます。

例：
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

その後、トラッカースクリプトは`"https://<あなたの自己ホストドメイン>/my-tracker.js"`で利用できます。

これは一部の広告ブロッカーを回避するのに役立ちます。

`.js`のサフィックスは必要ありません。選択した任意のパスを使用できます。例として`CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"`のように指定することも可能です。

## 特定のドメインのみをトラッキング

一般的に、トラッカーはウェブサイトが動作しているすべての場所でイベントを報告します。しかし、時には`localhost`のようなイベントを無視したい場合があります。

Tianjiはトラッカースクリプトに属性を提供しており、それを使用できます。

スクリプトに`data-domains`を追加できます。値はトラッキング対象のルートドメインにすべきです。複数のドメインを指定するには`,`で区切ります。

```html
<script async defer src="https://<あなたの自己ホストドメイン>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

これで、これらのドメインからのイベントのみを見ることができます。
