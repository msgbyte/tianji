---
sidebar_position: 1
_i18n_hash: ce8b2ef04235ac36f0637772cc3b720a
---
# Bereitstellung von Reporter als DaemonSet

Wenn Sie Tianji innerhalb von Kubernetes ausführen, möchten Sie möglicherweise die Systemmetriken jedes Knotens erfassen. Der einfachste Weg ist, `tianji-reporter` als DaemonSet auszuführen, sodass es auf jedem Knoten läuft.

1. Bearbeiten Sie `docker/k8s/reporter-daemonset.yaml` und ersetzen Sie die Werte `TIANJI_SERVER_URL` und `TIANJI_WORKSPACE_ID` durch Ihre tatsächliche Serveradresse und Arbeitsbereichs-ID.
2. Wenden Sie das Manifest an:

```bash
kubectl apply -f docker/k8s/reporter-daemonset.yaml
```

Jeder Knoten startet einen `tianji-reporter` Container, der Systemstatistiken an Ihre Tianji-Instanz meldet. Sie können die Protokolle eines bestimmten Pods überprüfen, um sicherzustellen, dass es funktioniert:

```bash
kubectl logs -l app=tianji-reporter -f
```

Sobald die Pods laufen, wird die Seite **Server** in Tianji Ihre Kubernetes-Knoten wie normale Maschinen auflisten.
