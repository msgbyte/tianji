---
sidebar_position: 1
_i18n_hash: bcb6522b66b64594f82548e296f77934
---
# 跟踪器脚本

## 安装

要跟踪网站事件，您只需将一个简单的脚本（< 2 KB）注入到您的网站中。

脚本如下所示：

```html
<script async defer src="https://<your-self-hosted-domain>/tracker.js" data-website-id="xxxxxxxxxxxxx"></script>
```

您可以从 **Tianji** 网站列表中获取此脚本代码。

## 报告事件

**Tianji** 提供了一种简单的方式来报告用户点击事件，这有助于您跟踪用户喜欢和经常使用的操作。

这是网站分析中非常常见的方法。您可以通过使用 **Tianji** 快速实现。

在将脚本代码注入到您的网站后，您只需在 DOM 属性中添加一个 `data-tianji-event`。

例如：

```html
<button data-tianji-event="submit-login-form">登录</button>
```

现在，当用户点击此按钮时，您的仪表板将接收到新的事件。

## 修改默认脚本名称

> 此功能在 v1.7.4+ 版本中可用

您可以在启动时使用环境变量 `CUSTOM_TRACKER_SCRIPT_NAME`。

例如：
```
CUSTOM_TRACKER_SCRIPT_NAME="my-tracker.js"
```

然后您可以通过 `"https://<your-self-hosted-domain>/my-tracker.js"` 访问您的跟踪器脚本。

这是为了帮助您避免一些广告拦截器。

您不需要 `.js` 后缀。它可以是您选择的任何路径，甚至可以使用 `CUSTOM_TRACKER_SCRIPT_NAME="this/is/very/long/path"`。

## 仅跟踪指定域名

通常情况下，跟踪器会在您的网站运行的任何地方报告所有事件。但有时我们需要忽略像 `localhost` 这样的事件。

Tianji 提供了一个跟踪器脚本的属性来实现这一点。

您可以在脚本中添加 `data-domains`。该值应为您要跟踪的根域名。使用 `,` 分隔多个域名。

```html
<script async defer src="https://<your-self-hosted-domain>/tracker.js" data-website-id="xxxxxxxxxxxxx" data-domains="website.com,www.website.com"></script>
```

然后您只能看到来自这些域名的事件。
