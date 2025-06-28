---
sidebar_position: 1
_i18n_hash: d9dd1597f6c275ebc68c7421c31b29fe
---
# 服务器状态报告器

您可以使用天机报告器轻松报告服务器状态。

您可以从[https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases)下载。

## 使用方法

```
tianji-reporter 用法:
  --interval int
        输入时间间隔，单位秒（默认值 5）
  --mode http
        报告数据的发送模式，可选择: `http` 或 `udp`，默认为 `http` (默认 "http")
  --name string
        此机器的标识名称
  --url string
        天机的 HTTP URL，例如：https://tianji.msgbyte.com
  --vnstat
        使用 vnstat 进行流量统计，仅限 Linux
  --workspace string
        天机的工作区 ID，这应该是一个 UUID
```

**url** 和 **workspace** 是必需的，它们表示您将把服务报告到哪个主机和哪个工作区。

默认情况下，服务器节点名称将与主机名相同，您可以使用 `--name` 自定义名称，以帮助您识别服务器。

## 自动安装脚本

您可以在 `Tianji` -> `Servers` -> `Add` -> `Auto` 标签中获取自动安装脚本。

该脚本将自动下载报告器并在您的机器上创建 Linux 服务，因此需要 root 权限。

### 卸载

如果您想卸载报告服务，可以使用如下命令：

```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
```

主要的更改是向安装命令中追加 `-s uninstall`。

## 问答

### 如何检查天机报告服务日志？

如果您通过自动安装脚本进行安装，天机会帮助您在 Linux 机器上安装一个名为 `tianji-reporter` 的服务。

您可以使用以下命令检查天机报告日志：

```bash
journalctl -fu tianji-reporter.service
```

### 即使报告显示成功，服务器选项卡中也找不到您的机器

可能是您的天机位于反向代理（例如 `nginx`）后面。

请确保您的反向代理添加了 WebSocket 支持。

## 为什么我的机器总是离线？

请检查您的服务器日期时间。
