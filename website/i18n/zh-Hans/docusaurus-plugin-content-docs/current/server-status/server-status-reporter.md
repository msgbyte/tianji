---
sidebar_position: 1
_i18n_hash: 21a5dc8265605536c8c328c551abdcc9
---
# 服务器状态报告工具

您可以使用天机报告工具轻松报告服务器状态

可以从 [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases) 下载

## 使用方法

```
tianji-reporter 的用法：
  --interval int
        输入报告间隔时间，以秒为单位（默认 5）
  --mode http
        报告数据的发送模式，可选择：`http` 或 `udp`，默认为 `http`（默认 "http"）
  --name string
        该机器的标识名称
  --url string
        天机的 http 地址，例如：https://tianji.msgbyte.com
  --vnstat
        使用 vnstat 进行流量统计，仅限 Linux
  --workspace string
        天机的工作区 ID，应为一个 UUID
```

**url** 和 **workspace** 是必需的，这意味着您将把服务报告到哪个主机和工作区。

默认情况下，服务器节点名称将与主机名相同，您可以使用 `--name` 自定义名称，以帮助识别服务器。

## 自动安装脚本

可以在 `Tianji` -> `Servers` -> `Add` -> `Auto` 选项卡中获取自动安装脚本

它会自动下载报告工具并在您的机器中创建 Linux 服务，因此需要 root 权限。

### 卸载

如果想卸载报告服务，可以使用以下命令：
```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
``` 

主要区别是将 `-s uninstall` 添加到您的安装命令中。

## Kubernetes

如果您的服务器运行在 Kubernetes 集群中，可以将报告工具作为 DaemonSet 部署，这样每个节点都会自动报告指标。详情请参见 [以 DaemonSet 方式部署报告工具](./kubernetes/reporter-daemonset.md)。

## 常见问题解答

### 如何检查天机报告服务日志？

如果您使用自动安装脚本进行安装，天机会在您的 Linux 机器上帮助您安装一个名为 `tianji-reporter` 的服务。

可以使用以下命令检查天机报告日志：

```bash
journalctl -fu tianji-reporter.service
```

### 即使报告显示成功，服务器选项卡中也找不到您的机器

可能是您的天机位于反向代理后面，例如 `nginx`。

请确保您的反向代理添加了对 WebSocket 的支持。

## 为什么我的机器始终处于离线状态？

请检查您的服务器日期时间。
