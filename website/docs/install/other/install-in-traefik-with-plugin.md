---
sidebar_position: 2
---

# Install in Traefik with plugin

Tianji provides a Traefik plugin that allows you to easily integrate Tianji website analytics functionality into your Traefik proxy.

## Plugin Overview

[traefik-tianji-plugin](https://github.com/msgbyte/traefik-tianji-plugin) is a Traefik middleware plugin specifically developed for Tianji that can automatically inject the Tianji tracking script into your website without modifying your website code to start collecting visitor data.

## Installing the Plugin

### 1. Add Plugin in Static Configuration

First, you need to add the plugin reference in Traefik's static configuration. The plugin version number references the git tag.

#### YAML Configuration

Add the following to your `traefik.yml` or static configuration file:

```yaml
experimental:
  plugins:
    traefik-tianji-plugin:
      moduleName: "github.com/msgbyte/traefik-tianji-plugin"
      version: "v0.2.1"
```

#### TOML Configuration

```toml
[experimental.plugins.traefik-tianji-plugin]
  moduleName = "github.com/msgbyte/traefik-tianji-plugin"
  version = "v0.2.1"
```

#### Command Line

```bash
--experimental.plugins.traefik-tianji-plugin.modulename=github.com/msgbyte/traefik-tianji-plugin
--experimental.plugins.traefik-tianji-plugin.version=v0.2.1
```

### 2. Configure Middleware

After installing the plugin, you need to configure the middleware in the dynamic configuration.

#### YAML Dynamic Configuration

In your `config.yml` or dynamic configuration file:

```yaml
http:
  middlewares:
    my-tianji-middleware:
      plugin:
        traefik-tianji-plugin:
          tianjiHost: "https://tianji.your-domain.com"
          websiteId: "your-website-id"
```

#### TOML Dynamic Configuration

```toml
[http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin]
  tianjiHost = "https://tianji.your-domain.com"
  websiteId = "your-website-id"
```

#### Docker Compose Labels

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

## Configuration Parameters

### Required Parameters

- **tianjiHost**: The complete URL of your Tianji server
  - Example: `https://tianji.your-domain.com`
  - If using the official hosted service: `https://app-tianji.msgbyte.com`

- **websiteId**: The website ID created in Tianji
  - Can be found in the website settings of your Tianji admin panel

### Optional Parameters

The plugin also supports other configuration parameters to customize behavior. For specific parameters, please refer to the [GitHub repository documentation](https://github.com/msgbyte/traefik-tianji-plugin).

## Using the Middleware

After configuration, you need to use this middleware in your router:

### YAML Configuration

```yaml
http:
  routers:
    my-app:
      rule: "Host(`my-app.local`)"
      middlewares:
        - "my-tianji-middleware"
      service: "my-app-service"
```

### Docker Compose Labels

```yaml
labels:
  - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
```

## How It Works

1. When requests pass through the Traefik proxy, the plugin checks the response content
2. If the response is HTML content, the plugin automatically injects the Tianji tracking script
3. The script starts collecting visitor data and sends it to the Tianji server when the page loads

## Important Notes

- Ensure that the Tianji server address is accessible from client browsers
- The website ID must be valid, otherwise data cannot be collected properly
- The plugin only takes effect when the response content type is HTML
- It's recommended to use the latest version of the plugin for optimal performance and features

## Reference

- [Plugin Source Code](https://github.com/msgbyte/traefik-tianji-plugin)
- [Traefik Plugin Documentation](https://doc.traefik.io/traefik/plugins/)
