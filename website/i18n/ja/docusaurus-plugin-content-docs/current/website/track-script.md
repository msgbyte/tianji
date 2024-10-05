---
sidebar_position: 1
_i18n_hash: bcb6522b66b64594f82548e296f77934
---
# トラッカースクリプト

## インストール

ウェブサイトのイベントを追跡するには、シンプルなスクリプト（< 2 KB）をウェブサイトに挿入するだけです。

スクリプトは以下のようになります：

```html
<script async defer src="https://<your-self-hosted-domain>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

このスクリプトコードは、**Tianji** のウェブサイトリストから取得できます。

## イベントの報告

**Tianji** は、ユーザーのクリックイベントを報告する簡単な方法を提供しています。これにより、ユーザーが好むアクションや頻繁に使用するアクションを追跡するのが容易になります。

これはウェブサイト分析で非常に一般的な方法です。**Tianji** を使用してすぐに取得できます。

スクリプトコードをウェブサイトに挿入した後、DOM属性に `data-tianji-event` を追加するだけです。

例えば：

```html
<button data-tianji-event="submit-login-form">Login</button>
```

これで、ユーザーがこのボタンをクリックすると、ダッシュボードに新しいイベントが届きます。

## デフォルトのスクリプト名を変更する

> この機能は v1.7.4 以降で利用可能です。

起動時に環境変数 `CUSTOM_TRACKER_SCRIPT_NAME` を使用できます。

例えば：
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

その後、トラッカースクリプトに `"https://<your-self-hosted-domain>/my-tracker.js"` でアクセスできます。

これは、一部の広告ブロッカーを回避するのに役立ちます。

`.js` 拡張子は必要ありません。任意のパスを選択できます。例えば、`CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"` のように使用することもできます。

## 特定のドメインのみを追跡する

一般的に、トラッカーはサイトが実行されている場所ですべてのイベントを報告します。しかし、時には `localhost` のようなイベントを無視する必要があります。

Tianji は、トラッカースクリプトの属性を提供してそれを行います。

スクリプトに `data-domains` を追加できます。値は追跡するルートドメインである必要があります。複数のドメインを区切るには `,` を使用します。

```html
<script async defer src="https://<your-self-hosted-domain>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

これにより、これらのドメインからのイベントのみを確認できます。
