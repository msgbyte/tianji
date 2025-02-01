---
sidebar_position: 1
_i18n_hash: a3862480440a66a996f471d85570603d
---
# イベントトラッキング

ウェブサイト上でユーザーのアクションを追跡できます。Tianjiは、そのためのシンプルな方法を提供します。

## スクリプトタグを使用する場合

スクリプトタグを使用している場合、スクリプトをインジェクトした後の任意の場所で`track`関数を呼び出すだけです。

```ts
tianji.track(eventName, data);
```

## SDKを使用する場合

SDKを使用している場合、`initTianjiTracker()`の後に`reportEvent()`関数を呼び出すだけです。

```ts
import { initTianjiTracker, reportEvent } from 'tianji-sdk-client';

initTianjiTracker({
  url: backendUrl,
  websiteId,
});
    
reportEvent('デモイベント', {
  foo: 'bar',
});
```
