---
sidebar_position: 1
_i18n_hash: 21ae6837de110e1b576fdf570bbbea6c
---
# 追踪脚本

## 安装

要追踪网站事件，你只需在你的网站中注入一个简单的脚本（小于2 KB）。

脚本如下所示：

```html
<script async defer src="https://<你的自托管域名>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

你可以从你的 **Tianji** 网站列表中获取该脚本代码。

## 脚本属性

追踪脚本在 `<script>` 标签上支持以下 `data-*` 属性：

| 属性 | 是否必需 | 默认值 | 描述 |
|---|---|---|---|
| `data-website-id` | **是** | — | 用于关联追踪数据的网站唯一ID。没有这个追踪器将无法初始化。 |
| `data-host-url` | 否 | 脚本 `src` 源 | 后端服务器URL。如果省略，将自动从脚本的 `src` 路径推导。 |
| `data-auto-track` | 否 | `true` | 自动追踪页面浏览和路由更改。设置为 `"false"` 以禁用。 |
| `data-do-not-track` | 否 | — | 设置时，遵循浏览器的“请勿追踪”（DNT）设置，若启用DNT则禁用追踪。 |
| `data-domains` | 否 | — | 要追踪的域名，以逗号分隔（例如 `"example.com,www.example.com"`）。仅当当前主机名与这些域名之一匹配时追踪才有效。 |

### 完整示例

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

### 通过localStorage禁用追踪

你也可以通过设置localStorage标记在运行时禁用追踪：

```javascript
localStorage.setItem('tianji.disabled', '1');
```

## 上报事件

**Tianji** 提供简单的方法来上报用户点击事件，方便你追踪用户喜欢和经常使用的操作。

这是网站分析中非常常见的一种方法，你可以通过 **Tianji** 快速实现。

### 基本用法

在你的网页中注入脚本代码后，只需要在DOM属性中添加一个 `data-tianji-event`。

例如：

```html
<button data-tianji-event="submit-login-form">登录</button>
```

现在，当用户点击这个按钮时，你的仪表盘将收到新的事件。

### 附加事件数据

你可以通过使用 `data-tianji-event-{key}` 属性将附加数据附加到事件中。任何匹配此模式的属性都将被收集并随事件一起发送。

```html
<button 
  data-tianji-event="purchase" 
  data-tianji-event-product="Premium Plan"
  data-tianji-event-price="99"
  data-tianji-event-currency="USD">
  立即购买
</button>
```

这将发送一个名为 `purchase` 的事件，附带以下数据：
```json
{
  "product": "Premium Plan",
  "price": "99",
  "currency": "USD"
}
```

### 追踪链接点击

在锚点（`<a>`）标签上使用 `data-tianji-event` 时，**Tianji** 会特别处理，以确保在导航前追踪到事件：

```html
<a href="/pricing" data-tianji-event="view-pricing">查看价格</a>
```

对于内部链接（不在新标签中打开），追踪器将：
1. 阻止默认导航
2. 发送追踪事件
3. 在追踪完成后导航到目标URL

对于外部链接或带 `target="_blank"` 的链接，事件在不阻止导航的情况下被追踪。

### JavaScript API

加载追踪脚本后，你还可以使用 `window.tianji` 对象以编程方式追踪事件。

#### 追踪自定义事件

```javascript
// 简单的事件追踪
window.tianji.track('button-clicked');

// 带自定义数据的事件
window.tianji.track('purchase', {
  product: 'Premium Plan',
  price: 99,
  currency: 'USD'
});

// 使用自定义负载对象追踪
window.tianji.track({
  website: 'your-website-id',
  name: 'custom-event',
  data: { key: 'value' }
});

// 使用函数追踪（接收当前页面信息）
window.tianji.track((payload) => ({
  ...payload,
  name: 'dynamic-event',
  data: { timestamp: Date.now() }
}));
```

#### 识别用户

你可以将用户信息附加到追踪会话中：

```javascript
window.tianji.identify({
  userId: 'user-123',
  email: 'user@example.com',
  plan: 'premium'
});
```

这些信息将与该用户的后续事件关联。

## 修改默认脚本名称

> 此功能在v1.7.4+可用

启动时，你可以使用环境变量 `CUSTOM_TRACKER_SCRIPT_NAME`

例如：
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

然后你可以用 `"https://<你的自托管域名>/my-tracker.js"` 访问你的追踪脚本。

这可以帮助你避免一些广告拦截器。

不需要 `.js` 后缀。可以是你选择的任何路径，甚至可以使用 `CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"`。

## 仅追踪指定域名

通常无论你的网站运行在哪里，追踪器都会报告所有事件。但有时我们需要忽略如 `localhost` 的事件。

Tianji 提供追踪脚本的一个属性来做到这一点。

你可以在你的脚本中添加 `data-domains`。值应该是你的要追踪的根域名。使用逗号分隔多个域名。

```html
<script async defer src="https://<你的自托管域名>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

然后你只能看到这些域名的事件。
