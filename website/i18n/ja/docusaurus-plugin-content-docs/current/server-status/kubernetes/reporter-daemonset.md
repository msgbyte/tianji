---
sidebar_position: 1
_i18n_hash: ce8b2ef04235ac36f0637772cc3b720a
---

# DaemonSetとしてReporterをデプロイ

Kubernetes内でTianjiを稼働させている場合は、各ノードのシステムメトリックを収集したいかもしれません。最も簡単な方法は、`tianji-reporter`をDaemonSetとして実行し、すべてのノードで動作させることです。

1. `docker/k8s/reporter-daemonset.yaml`を編集し、実際のサーバーアドレスとワークスペースIDに合わせて`TIANJI_SERVER_URL`と`TIANJI_WORKSPACE_ID`の値を置き換えます。
2. マニフェストを適用します：

```bash
kubectl apply -f docker/k8s/reporter-daemonset.yaml
```

各ノードは`tianji-reporter`コンテナを開始し、システム統計をTianjiインスタンスに報告します。特定のポッドのログを確認して、正常に動作しているか確認できます：

```bash
kubectl logs -l app=tianji-reporter -f
```

ポッドが稼働し始めたら、Tianjiの**サーバーページ**にKubernetesノードが通常のマシンのようにリストアップされます。
