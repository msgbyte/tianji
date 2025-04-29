---
sidebar_position: 1
_i18n_hash: f0ed5671d5832e683b6ba533651a0eb7
---
# 事件追踪

您可以在网站上追踪用户行为。天际提供了一种简单的方法来实现这一点。

## 使用脚本标签

如果您使用脚本标签，您只需在注入脚本后调用 `track` 函数即可

```ts
tianji.track(eventName, data);
```

## 使用SDK

如果您使用SDK，您只需在调用 `initTianjiTracker()` 后调用 `reportEvent()` 函数

```ts
import { initTianjiTracker, reportEvent } from 'tianji-client-sdk';

initTianjiTracker({
  url: backendUrl,
  websiteId,
});
    
reportEvent('演示事件', {
  foo: 'bar',
});
```
