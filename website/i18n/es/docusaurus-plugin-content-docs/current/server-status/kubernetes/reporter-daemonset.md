---
sidebar_position: 1
_i18n_hash: ce8b2ef04235ac36f0637772cc3b720a
---
# Implementar Reporter como DaemonSet

Si estás ejecutando Tianji dentro de Kubernetes, es posible que desees recopilar las métricas del sistema de cada nodo. La manera más fácil es ejecutar `tianji-reporter` como un DaemonSet para que se ejecute en cada nodo.

1. Edita `docker/k8s/reporter-daemonset.yaml` y reemplaza los valores de `TIANJI_SERVER_URL` y `TIANJI_WORKSPACE_ID` con la dirección de tu servidor real y el ID del espacio de trabajo.
2. Aplica el manifiesto:

```bash
kubectl apply -f docker/k8s/reporter-daemonset.yaml
```

Cada nodo iniciará un contenedor `tianji-reporter` que reporta estadísticas del sistema a tu instancia de Tianji. Puedes verificar los registros de un pod específico para asegurarte de que funciona:

```bash
kubectl logs -l app=tianji-reporter -f
```

Una vez que los pods estén en funcionamiento, la página **Servidores** en Tianji enumerará tus nodos de Kubernetes igual que las máquinas regulares.
