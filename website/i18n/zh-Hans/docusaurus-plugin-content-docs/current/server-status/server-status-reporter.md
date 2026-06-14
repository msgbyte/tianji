---
sidebar_position: 1
_i18n_hash: 479219b036abf3d6006999bf96fd2ea9
---
# 服务器状态报告器

你可以通过 tianji reporter 轻松报告你的服务器状态

你可以从[https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases)下载

## 使用方法

```
tianji-reporter 使用：
  --interval int
        输入时间间隔，以秒为单位 (默认 5)
  --mode http
        数据报告的发送模式，可以选择：`http` 或 `udp`，默认是 `http` (默认 "http")
  --name string
        此机器的识别名称
  --url string
        tianji 的 http URL，例如：https://tianji.dev
  --vnstat
        使用 vnstat 进行流量统计，仅限 Linux
  --workspace string
        tianji 的工作空间 ID，应为一个 UUID
```

**url** 和 **workspace** 是必需的，这意味着你将把服务报告给哪个主机和哪个工作空间。

默认情况下，服务器节点名称将与主机名相同，所以你可以使用 `--name` 自定义名称，这可以帮助你识别服务器。

## 自动安装脚本

你可以在 `Tianji` -> `Servers` -> `Add` -> `Auto` 选项卡中获取自动安装脚本

它将自动下载 reporter 并在你的机器中创建 Linux 服务，因此需要 root 权限。

### 卸载

如果你想卸载 reporter 服务，可以使用如下命令：
```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
``` 

主要变化是在安装命令中添加 `-s uninstall`。

## Kubernetes

如果你的服务器在 Kubernetes 集群中运行，可以将 reporter 部署为 DaemonSet，以便每个节点自动报告指标。参阅[作为 DaemonSet 部署 Reporter](./kubernetes/reporter-daemonset.md)获取详细信息。

## 常见问题

### 如何查看 tianji reporter 服务日志？

如果你通过自动安装脚本进行安装，tianji 会在你的 Linux 机器上帮助你安装一个名为 `tianji-reporter` 的服务。

可以使用此命令检查 tianji reporter 日志：

```bash
journalctl -fu tianji-reporter.service
```

### 在服务器标签中找不到你的机器即使报告显示成功

可能是因为 tianji 位于反向代理之后，例如 `nginx`。

请确保你的反向代理已添加 WebSocket 支持。

## 为什么我的机器总是离线？

请检查你的服务器日期时间。
