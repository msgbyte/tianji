---
sidebar_position: 2
_i18n_hash: ca2b25a29f0f1a82407be367a1d03553
---
# 参数

以下是一些关于如何使用和配置遥测图像的示例。

所有参数都是可选的，它们将提升你在不同场景中的使用体验。

| 名称 | 描述 |
| -------- | --------- |
| url | 默认情况下，系统会获取浏览器自动生成的引用URL。但在某些网站上，可能不允许携带此头部信息，因此你需要自行提供。如果天机在任何地方都无法获取URL，系统将忽略此次访问，不记录此访问。 |
| name | 定义遥测事件的名称，可用于区分同一遥测记录中的不同事件。 |
| title | **[仅限徽章]**，定义徽章的标题 |
| start | **[仅限徽章]**，定义徽章的起始计数 |
| fullNum | **[仅限徽章]**，定义徽章是否显示完整数字，默认情况下会缩写数字（例如：`12345` 显示为 `12.3k`） |

## 如何使用

在URL中携带参数非常简单。

例如：

```
https://tianji.example.com/telemetry/<workspaceId>/<telemetryId>/badge.svg?name=myEvent&url=https://google.com&title=My+Counter&start=100000&fullNum=true
```

如果你对此不熟悉，可以查看相关维基页面：[https://en.wikipedia.org/wiki/Query_string](https://en.wikipedia.org/wiki/Query_string)
