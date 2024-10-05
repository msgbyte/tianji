---
sidebar_position: 1
_i18n_hash: c95e9693eac4df676574d4eb8357881d
---
# 使用 Helm 安装

Helm 是一个简化 Kubernetes 应用程序安装和管理的工具。通过 Helm，您可以轻松快速地在 Kubernetes 中享受 tianji。

## 添加仓库

首先，您需要将 msgbyte 的 charts 仓库添加到 Helm 仓库列表中。

```bash
helm repo add msgbyte https://msgbyte.github.io/charts
```

现在，您可以使用 `helm search` 命令搜索 tianji。

```bash
helm search repo tianji
```

## 安装

然后，您可以使用以下命令轻松安装：

```bash
helm install tianji msgbyte/tianji
```

这将为您带来一个 PostgreSQL 数据库和 tianji。
