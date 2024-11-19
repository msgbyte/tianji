---
sidebar_position: 1
_i18n_hash: 848acc7fae249b1c435a363e4693a5c7
---
# 服务器状态报告器

您可以使用天玑报告器轻松报告您的服务器状态。

您可以从 [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases) 下载。

## 使用方法

```
tianji-reporter 使用方法：
  --interval int
        输入间隔时间，单位为秒 (默认 5)
  --mode http
        报告数据的发送模式，可选：`http` 或 `udp`，默认是 `http` (默认 "http")
  --name string
        此机器的标识名称
  --url string
        天玑的 http 地址，例如：https://tianji.msgbyte.com
  --vnstat
        使用 vnstat 进行流量统计，仅限 Linux
  --workspace string
        天玑的工作区 ID，应为 UUID
```

**url** 和 **workspace** 是必需的，表示您将服务报告到哪个主机和工作区。

默认情况下，服务器节点名称将与主机名相同，因此您可以使用 `--name` 自定义名称，以便识别服务器。

## 自动安装脚本

您可以在 `天玑` -> `服务器` -> `添加` -> `自动` 标签中获取自动安装脚本。

它将自动下载报告器并在您的机器上创建 Linux 服务。因此，它需要 root 权限。

### 卸载

如果您想卸载报告器服务，可以使用以下命令：
```bash
curl -o- https://tianji.exmaple.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
```

主要变化是在安装命令后添加 `-s uninstall`。

## 常见问题

### 如何查看天玑报告器服务日志？

如果您使用自动安装脚本进行安装，天玑将帮助您在 Linux 机器上安装一个名为 `tianji-reporter` 的服务。

您可以使用以下命令查看天玑报告器日志：

```bash
journalctl -fu tianji-reporter.service
```

### 即使在报告成功后，服务器标签中仍未找到您的机器

可能您的天玑位于反向代理（例如 `nginx`）之后。

请确保您的反向代理添加了 WebSocket 支持。

## 为什么我的机器总是离线？

请检查您的服务器时间。
