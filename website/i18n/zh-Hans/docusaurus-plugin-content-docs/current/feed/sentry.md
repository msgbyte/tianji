---
sidebar_position: 1
_i18n_hash: c24c34a1a9df2ee5bd25253195dcba08
---
# 与 Sentry 集成

:::info
了解更多关于 Sentry 的信息，请访问 [sentry.io](https://sentry.io/)
:::

点击 `设置` => `集成` => `创建新集成`

![](/img/docs/sentry/sentry1.png)

创建一个 `内部集成` 应用程序

![](/img/docs/sentry/sentry2.png)

输入名称 `Tianji` 并将 webhook URL 填入表单。

![](/img/docs/sentry/sentry3.png)

别忘了启用 `警报规则操作`

![](/img/docs/sentry/sentry4.png)

然后，添加问题读取 `权限`，并为 webhook 添加 `问题` 和 `错误`

![](/img/docs/sentry/sentry5.png)

最后，您可以创建一个警报规则，并在通知部分的下来列表中看到 `Tianji`

![](/img/docs/sentry/sentry6.png)
