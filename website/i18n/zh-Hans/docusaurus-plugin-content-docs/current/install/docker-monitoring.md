---
sidebar_position: 20
_i18n_hash: e85199043ed7e89d1e71ea95a75b08df
---
# Docker容器监控配置

## 默认监控行为

当您使用Docker或Docker Compose安装Tianji时，系统会自动启用内置的服务器监控功能。默认情况下：

- **Tianji会自动监控其自身容器**的系统资源使用情况
- 监控数据包括：CPU使用率、内存使用量、磁盘使用量、网络流量等
- 这些数据会自动报告到默认的工作区，无需额外配置
- 该容器将在监控仪表板中显示为`tianji-container`

## 监控主机上所有的Docker服务

如果您希望Tianji监控主机上运行的所有Docker容器和服务，而不仅仅是Tianji本身，您需要将Docker Socket映射到容器中。

### 配置方法

在`docker-compose.yml`文件的`tianji`服务部分中添加以下volumes配置：

```yaml
services:
  tianji:
    image: moonrailgun/tianji
    # ... 其他配置 ...
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    # ... 其他配置 ...
```

### 完整的docker-compose.yml示例

```yaml
version: '3'
services:
  tianji:
    image: moonrailgun/tianji
    build:
      context: ./
      dockerfile: ./Dockerfile
    ports:
      - "12345:12345"
    environment:
      DATABASE_URL: postgresql://tianji:tianji@postgres:5432/tianji
      JWT_SECRET: replace-me-with-a-random-string
      ALLOW_REGISTER: "false"
      ALLOW_OPENAPI: "true"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # 添加此行
    depends_on:
      - postgres
    restart: always
  postgres:
    # ... postgres配置 ...
```

### 使用Docker Run命令

如果您使用`docker run`命令启动Tianji，可以添加以下参数：

```bash
docker run -d \
  --name tianji \
  -p 12345:12345 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  moonrailgun/tianji
```

## 配置后的效果

添加Docker Socket映射后，Tianji将能够：

- 监控主机上运行的所有Docker容器
- 获取容器资源使用信息
- 显示容器状态信息
- 提供更全面的系统监控视图
