---
sidebar_position: 1
_i18n_hash: 1de8a86599061f446dd0699137a4e68c
---
# 服务器状态报告工具

您可以轻松使用天际报告工具报告您的服务器状态。

您可以从[https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases)下载。

## 用法

```
使用 tianji-reporter：
  --interval int
        输入间隔，单位秒（默认为 5）
  --mode http
        报告数据的发送模式，可以选择：`http` 或 `udp`，默认是 `http`（默认 "http"）
  --name string
        此机器的标识名称
  --url string
        天际的 http 地址，例如： https://tianji.msgbyte.com
  --vnstat
        使用 vnstat 进行流量统计，仅限 Linux
  --workspace string
        天际的工作区 ID，这应该是一个 uuid
```

**url** 和 **workspace** 是必需的，这意味着您将向哪个主机和哪个工作区报告您的服务。

默认情况下，服务器节点名称将与主机名相同，因此您可以使用 `--name` 自定义您的名称，这可以帮助您识别服务器。

## 自动安装脚本

您可以在 `Tianji` -> `Servers` -> `Add` -> `Auto` 标签页中获取自动安装脚本。

它将自动下载报告工具并在您的机器上创建 Linux 服务，因此需要 root 权限。

### 卸载

如果您想卸载报告服务，可以使用如下命令：
```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
``` 

主要更改是在安装命令后附加 `-s uninstall`。

## 问答

### 如何检查天际报告服务日志？

如果您使用自动安装脚本安装，天际将帮助您在 Linux 机器上安装名为 `tianji-reporter` 的服务。

您可以使用此命令检查天际报告日志：

```bash
journalctl -fu tianji-reporter.service
```

### 在服务器标签中未找到您的机器，即使报告显示成功

可能是您的天际在反向代理后面，例如 `nginx`。

请确保您的反向代理添加了 websocket 支持。

## 为什么我的机器总是离线？

请检查您的服务器日期时间。
