---
sidebar_position: 2
_i18n_hash: 7ce5eca3bf7af802db48c3db37d996f5
---
# 服务器状态页面

您可以为用户创建一个服务器状态页面，以便向公众展示您的服务器状态。

## 配置自定义域名

您可以在自己的域名上配置状态页面，例如：`status.example.com`

在页面配置中设置，并在您的DNS控制面板中创建一个`CNAME`记录。

```
CNAME status.example.com tianji.example.com
```

然后您可以通过自定义域名`status.example.com`访问您的页面。
