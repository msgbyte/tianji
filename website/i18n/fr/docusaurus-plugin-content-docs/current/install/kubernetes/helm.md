---
sidebar_position: 1
_i18n_hash: c95e9693eac4df676574d4eb8357881d
---
# Installation avec Helm

Helm est un outil qui facilite l'installation et la gestion des applications Kubernetes. Avec Helm, vous pouvez facilement et rapidement profiter de tianji sur Kubernetes.

## Ajouter le dépôt

Tout d'abord, vous devez ajouter le registre de charts msgbyte à la liste des dépôts Helm.

```bash
helm repo add msgbyte https://msgbyte.github.io/charts
```

Vous pouvez maintenant rechercher tianji avec la commande `helm search`.

```bash
helm search repo tianji
```

## Installer

Ensuite, n'hésitez pas à installer avec une seule commande :

```bash
helm install tianji msgbyte/tianji
```

Cela vous apportera une base de données pg et tianji.
