---
sidebar_position: 1
_i18n_hash: ff4eb3f4ea3a3e6b1f20d9ffb0837623
---
# 事件追踪

您可以追踪网站上的用户操作。Tianji提供了一种简单的方法来实现这一点。

## 使用脚本标签

如果您使用脚本标签，只需在注入脚本后的任意位置调用 `track` 函数即可。

```ts
tianji.track(eventName, data);
```

## 使用SDK

如果您使用SDK，只需在 `initTianjiTracker()` 后调用 `reportEvent()` 函数。

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
