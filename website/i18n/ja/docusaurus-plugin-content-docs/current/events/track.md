---
sidebar_position: 1
_i18n_hash: f0ed5671d5832e683b6ba533651a0eb7
---
# イベントトラッキング

ウェブサイト上のユーザーのアクションを追跡できます。Tianjiは、それを簡単に行う方法を提供します。

## スクリプトタグを使用する場合

スクリプトタグを使用している場合は、スクリプトをインジェクトした後の任意の場所で`track`関数を呼び出すだけです。

```ts
tianji.track(eventName, data);
```

## SDKを使用する場合

SDKを使用している場合は、`initTianjiTracker()`の後に`reportEvent()`関数を呼び出すだけです。

```ts
import { initTianjiTracker, reportEvent } from 'tianji-client-sdk';

initTianjiTracker({
  url: backendUrl,
  websiteId,
});
    
reportEvent('デモイベント', {
  foo: 'bar',
});
```
