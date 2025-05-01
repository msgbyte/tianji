---
sidebar_position: 1
_i18n_hash: ff4eb3f4ea3a3e6b1f20d9ffb0837623
---
# イベントトラッキング

ウェブサイト上のユーザーのアクションを追跡できます。Tianjiはそれを行う簡単な方法を提供します。

## スクリプトタグの使用

スクリプトタグを使用している場合、スクリプトを注入した後、どこでも`track`関数を呼び出すだけで済みます。

```ts
tianji.track(eventName, data);
```

## SDKの使用

SDKを使用している場合、`initTianjiTracker()`の後に`reportEvent()`関数を呼び出すだけで済みます。

```ts
import { initTianjiTracker, reportEvent } from 'tianji-client-sdk';

initTianjiTracker({
  url: backendUrl,
  websiteId,
});

reportEvent('Demo Event', {
  foo: 'bar',
});
```
