---
sidebar_position: 2
_i18n_hash: cecc3b1b7eb92c03797671e2ab259486
---
# 服务器状态页面

您可以创建一个服务器状态页面，向用户展示您的服务器状态，以便其他人了解。

## 配置自定义域名

您可以在自己的域名中配置状态页面，例如：`status.example.com`

在页面配置中设置，并在您的DNS管理中创建一个`CNAME`记录。

```
CNAME status.example.com tianji.example.com
```

然后您可以通过自定义的`status.example.com`访问您的页面。

### 故障排除

如果您遇到500错误，可能是您的反向代理未正确配置。

请确保您的反向代理包含您的新状态路由。

例如：
```
server {
  listen 80;
  server_name tianji.example.com status.example.com;
  listen 443 ssl;
}
```
