---
sidebar_position: 1
_i18n_hash: ce8b2ef04235ac36f0637772cc3b720a
---

# Déployer Reporter en tant que DaemonSet

Si vous exécutez Tianji à l'intérieur de Kubernetes, vous voudrez peut-être collecter les métriques système de chaque nœud. Le moyen le plus simple est d'exécuter `tianji-reporter` en tant que DaemonSet pour qu'il fonctionne sur chaque nœud.

1. Modifiez `docker/k8s/reporter-daemonset.yaml` et remplacez les valeurs `TIANJI_SERVER_URL` et `TIANJI_WORKSPACE_ID` par votre adresse de serveur réelle et votre ID de workspace.
2. Appliquez le manifeste :

```bash
kubectl apply -f docker/k8s/reporter-daemonset.yaml
```

Chaque nœud lancera un conteneur `tianji-reporter` qui enverra les statistiques système à votre instance Tianji. Vous pouvez vérifier les journaux d'un pod spécifique pour vous assurer que cela fonctionne :

```bash
kubectl logs -l app=tianji-reporter -f
```

Une fois que les pods sont en cours d'exécution, la page **Serveurs** de Tianji listera vos nœuds Kubernetes comme des machines normales.
