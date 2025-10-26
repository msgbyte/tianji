---
sidebar_position: 1
_i18n_hash: ef9fc0eb6072a8f037b70ff2b56e12ae
---
# 追踪脚本

## 安装

要跟踪网站事件，您只需在您的网站中注入一个简单的脚本（小于2 KB）。

脚本如下所示：

```html
<script async defer src="https://<your-self-hosted-domain>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

您可以从您的 **Tianji** 网站列表中获取此脚本代码。

## 报告事件

**Tianji** 提供了一种简单的方法来报告用户点击事件，这可以帮助您轻松跟踪用户喜欢和常用的操作。

这是一种在网站分析中非常常见的方法。您可以通过使用 **Tianji** 快速获取。

### 基本用法

在您将脚本代码注入您的网站后，您只需在 dom 属性中添加一个 `data-tianji-event`。

例如：

```html
<button data-tianji-event="submit-login-form">登录</button>
```

现在，当用户点击此按钮时，您的仪表盘将收到新的事件。

### 附加事件数据

您可以通过使用 `data-tianji-event-{key}` 属性向您的事件附加其他数据。任何符合此模式的属性都会被收集并与事件一起发送。

```html
<button 
  data-tianji-event="purchase" 
  data-tianji-event-product="Premium Plan"
  data-tianji-event-price="99"
  data-tianji-event-currency="USD">
  立即购买
</button>
```

这将发送一个名为 `purchase` 的事件，其数据如下：
```json
{
  "product": "Premium Plan",
  "price": "99",
  "currency": "USD"
}
```

### 跟踪链接点击

在 `<a>` 标签上使用 `data-tianji-event` 时，**Tianji** 会特别处理它们以确保在导航之前跟踪事件：

```html
<a href="/pricing" data-tianji-event="view-pricing">查看定价</a>
```

对于内部链接（不在新标签中打开），追踪器将：
1. 阻止默认导航
2. 发送跟踪事件
3. 在完成跟踪后导航到目标 URL

对于外部链接或带有 `target="_blank"` 的链接，事件会在不阻止导航的情况下被跟踪。

### JavaScript API

加载追踪脚本后，您还可以使用 `window.tianji` 对象以编程方式跟踪事件。

#### 跟踪自定义事件

```javascript
// 简单的事件跟踪
window.tianji.track('button-clicked');

// 带有自定义数据的事件
window.tianji.track('purchase', {
  product: 'Premium Plan',
  price: 99,
  currency: 'USD'
});

// 使用自定义有效载荷对象跟踪
window.tianji.track({
  website: 'your-website-id',
  name: 'custom-event',
  data: { key: 'value' }
});

// 使用函数进行跟踪（接收当前页面信息）
window.tianji.track((payload) => ({
  ...payload,
  name: 'dynamic-event',
  data: { timestamp: Date.now() }
}));
```

#### 识别用户

您可以将用户信息附加到跟踪会话中：

```javascript
window.tianji.identify({
  userId: 'user-123',
  email: 'user@example.com',
  plan: 'premium'
});
```

此信息将与该用户的后续事件关联。

## 修改默认脚本名称

> 此功能在 v1.7.4+ 中可用

您可以在启动时使用环境变量 `CUSTOM_TRACKER_SCRIPT_NAME`

例如：
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

然后可以通过 `"https://<your-self-hosted-domain>/my-tracker.js"` 访问您的追踪脚本

这可以帮助您避免某些广告拦截器。

您不需要 `.js` 后缀。它可以是您选择的任何路径，即使您可以使用 `CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"`

## 仅跟踪指定域名

通常，追踪器会报告您的网站运行的所有事件。但有时我们需要忽略像 `localhost` 这样的事件。

Tianji 提供了一个追踪脚本属性来实现这一点。

您可以在脚本中添加 `data-domains`。该值应为您要跟踪的根域名。使用 `,` 分隔多个域名。

```html
<script async defer src="https://<your-self-hosted-domain>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

然后，您将只能看到这些域名的事件。
