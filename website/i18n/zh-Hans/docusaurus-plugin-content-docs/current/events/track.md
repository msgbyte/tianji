---
sidebar_position: 1
_i18n_hash: a3862480440a66a996f471d85570603d
---
# 事件跟踪

您可以跟踪网站上的用户行为。天池提供了一种简单的方法来实现这一点。

## 使用脚本标签

如果您使用的是脚本标签，只需在注入脚本后任何地方调用 `track` 函数即可。

```ts
tianji.track(eventName, data);
```

## 使用 SDK

如果您使用的是 SDK，只需在调用 `initTianjiTracker()` 后调用 `reportEvent()` 函数即可。

```ts
import { initTianjiTracker, reportEvent } from 'tianji-sdk-client';

initTianjiTracker({
  url: backendUrl,
  websiteId,
});
    
reportEvent('演示事件', {
  foo: 'bar',
});
```
