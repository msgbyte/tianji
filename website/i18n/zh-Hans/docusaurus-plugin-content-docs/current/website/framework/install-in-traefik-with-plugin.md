---
sidebar_position: 2
_i18n_hash: 8142a07cc46361e9e72d8c883ab7869a
---
# 在 Traefik 中安装插件

Tianji 提供了一个 Traefik 插件，可让您轻松地将 Tianji 网站分析功能集成到您的 Traefik 代理中。

## 插件概述

[traefik-tianji-plugin](https://github.com/msgbyte/traefik-tianji-plugin) 是一个专为 Tianji 开发的 Traefik 中间件插件，可以自动将 Tianji 跟踪脚本注入到您的网站中，无需修改您的网站代码，即可开始收集访客数据。

## 安装插件

### 1. 在静态配置中添加插件

首先，您需要在 Traefik 的静态配置中添加插件引用。插件版本号引用的是 git 标签。

#### YAML 配置

将以下内容添加到您的 `traefik.yml` 或静态配置文件中：

```yaml
experimental:
  plugins:
    traefik-tianji-plugin:
      moduleName: "github.com/msgbyte/traefik-tianji-plugin"
      version: "v0.2.1"
```

#### TOML 配置

```toml
[experimental.plugins.traefik-tianji-plugin]
  moduleName = "github.com/msgbyte/traefik-tianji-plugin"
  version = "v0.2.1"
```

#### 命令行

```bash
--experimental.plugins.traefik-tianji-plugin.modulename=github.com/msgbyte/traefik-tianji-plugin
--experimental.plugins.traefik-tianji-plugin.version=v0.2.1
```

### 2. 配置中间件

安装插件后，您需要在动态配置中配置中间件。

#### YAML 动态配置

在您的 `config.yml` 或动态配置文件中：

```yaml
http:
  middlewares:
    my-tianji-middleware:
      plugin:
        traefik-tianji-plugin:
          tianjiHost: "https://tianji.your-domain.com"
          websiteId: "your-website-id"
```

#### TOML 动态配置

```toml
[http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin]
  tianjiHost = "https://tianji.your-domain.com"
  websiteId = "your-website-id"
```

#### Docker Compose 标签

```yaml
version: '3.7'
services:
  my-app:
    image: nginx:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.my-app.rule=Host(`my-app.local`)"
      - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.tianjiHost=https://tianji.your-domain.com"
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.websiteId=your-website-id"
```

## 配置参数

### 必需参数

- **tianjiHost**: 您的 Tianji 服务器的完整 URL
  - 示例: `https://tianji.your-domain.com`
  - 如果使用官方托管服务: `https://app-tianji.msgbyte.com`

- **websiteId**: 在 Tianji 中创建的网站 ID
  - 可以在您的 Tianji 管理面板的网站设置中找到

### 可选参数

插件还支持其他配置参数用于自定义行为。具体参数请参阅 [GitHub 仓库文档](https://github.com/msgbyte/traefik-tianji-plugin)。

## 使用中间件

配置完成后，您需要在路由器中使用此中间件：

### YAML 配置

```yaml
http:
  routers:
    my-app:
      rule: "Host(`my-app.local`)"
      middlewares:
        - "my-tianji-middleware"
      service: "my-app-service"
```

### Docker Compose 标签

```yaml
labels:
  - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
```

## 工作原理

1. 当请求通过 Traefik 代理时，插件会检查响应内容
2. 如果响应为 HTML 内容，插件会自动注入 Tianji 跟踪脚本
3. 脚本在页面加载时开始收集访客数据并将其发送到 Tianji 服务器

## 重要提示

- 确保 Tianji 服务器地址可以被客户端浏览器访问
- 网站 ID 必须有效，否则无法正确收集数据
- 插件仅在响应内容类型为 HTML 时生效
- 建议使用最新版本的插件以获得最佳性能和功能

## 参考

- [插件源代码](https://github.com/msgbyte/traefik-tianji-plugin)
- [Traefik 插件文档](https://doc.traefik.io/traefik/plugins/)
