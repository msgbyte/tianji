---
sidebar_position: 1
---

# Deploy Reporter as DaemonSet

If you are running Tianji inside Kubernetes, you may want to collect each node's
system metrics. The easiest way is to run `tianji-reporter` as a DaemonSet so it
runs on every node.

1. Edit `docker/k8s/reporter-daemonset.yaml` and replace the `TIANJI_SERVER_URL` and `TIANJI_WORKSPACE_ID` values with your actual server address and workspace ID.
2. Apply the manifest:

```bash
kubectl apply -f docker/k8s/reporter-daemonset.yaml
```

Every node will start a `tianji-reporter` container which reports system
statistics to your Tianji instance. You can check the logs of a specific pod to
ensure it works:

```bash
kubectl logs -l app=tianji-reporter -f
```

Once the pods are running, the **Servers** page in Tianji will list your
Kubernetes nodes just like regular machines.
