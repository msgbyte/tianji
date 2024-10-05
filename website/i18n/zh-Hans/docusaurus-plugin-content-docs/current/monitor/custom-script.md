---
sidebar_position: 1
_i18n_hash: b3805dea583e9b96a5bf32e57ff9c130
---
# 自定义脚本

与传统的监控服务相比，**天机** 支持自定义脚本来支持更多定制化场景。

本质上，你可以将其理解为一个受限的、内存安全的 JavaScript 运行时，它接受一个数字来显示在你的图表上。最常见的场景是访问一个 URL 所需的网络请求时间。当然，它也可以是其他东西，例如你的 OpenAI 余额、你的 GitHub 星标数量，以及所有可以用数字表示的信息。

如果此脚本返回 -1，则表示此工作失败，并尝试向你发送通知，就像正常监控一样。

如果你想查看一个数字变化的趋势，开启趋势模式可以帮助你更好地发现数字的细微变化。

以下是一些示例：

## 示例

### 从健康端点获取 Tailchat 可用服务数量

```js
const res = await request({
  url: 'https://<tailchat-server-api>/health'
})

if(!res || !res.data || !res.data.services) {
  return -1
}

return res.data.services.length
```

### 获取 GitHub 星标数量

```js
const res = await request({
  url: 'https://api.github.com/repos/msgbyte/tianji'
})

return res.data.stargazers_count ?? -1
```

将 `msgbyte/tianji` 替换为你自己的仓库名称

### 获取 Docker 拉取数量

```js
const res = await request({
  url: "https://hub.docker.com/v2/repositories/moonrailgun/tianji/"
});

return res.data.pull_count;
```

将 `moonrailgun/tianji` 替换为你自己的镜像名称

### 匹配文本的示例

```js
const start = Date.now();
const res = await request({
  url: "https://example.com/"
});

const usage = Date.now() - start;

const matched = /maintain/.test(String(res.data));

if(matched) {
  return -1;
}

return usage;
```

返回 `-1` 表示某些地方出错了。在这种情况下，表示 HTML 主体中包含 `maintain` 文本。

### 或者更多

非常欢迎你在这个页面提交你的脚本。天机是由开源社区驱动的。
