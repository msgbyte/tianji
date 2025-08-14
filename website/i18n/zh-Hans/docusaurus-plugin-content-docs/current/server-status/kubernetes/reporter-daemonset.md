---
sidebar_position: 1
_i18n_hash: ce8b2ef04235ac36f0637772cc3b720a
---
# 将 Reporter 部署为 DaemonSet

如果您在 Kubernetes 中运行 Tianji，可能会希望收集每个节点的系统指标。最简单的方法是将 `tianji-reporter` 作为 DaemonSet 运行，这样它就会在每个节点上运行。

1. 编辑 `docker/k8s/reporter-daemonset.yaml`，将 `TIANJI_SERVER_URL` 和 `TIANJI_WORKSPACE_ID` 的值替换为您的实际服务器地址和工作空间 ID。
2. 应用该清单：

```bash
kubectl apply -f docker/k8s/reporter-daemonset.yaml
```

每个节点将启动一个 `tianji-reporter` 容器，报告系统统计信息到您的 Tianji 实例。您可以检查特定 Pod 的日志以确保其正常工作：

```bash
kubectl logs -l app=tianji-reporter -f
```

一旦 Pod 正在运行，Tianji 的 **Servers** 页面将像列出常规机器一样列出您的 Kubernetes 节点。
