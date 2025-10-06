---
sidebar_position: 1
_i18n_hash: ff4eb3f4ea3a3e6b1f20d9ffb0837623
---
# Pelacakan Acara

Anda dapat melacak tindakan pengguna di situs web Anda. Tianji menyediakan cara sederhana untuk melakukannya.

## Menggunakan Tag Skrip

Jika Anda menggunakan tag skrip, Anda hanya perlu memanggil fungsi `track` di manapun setelah Anda menyematkan skrip

```ts
tianji.track(eventName, data);
```

## Menggunakan SDK

Jika Anda menggunakan SDK, Anda hanya perlu memanggil fungsi `reportEvent()` setelah Anda `initTianjiTracker()`

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
