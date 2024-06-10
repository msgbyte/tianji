---
sidebar_position: 1
---

# Install in Helm

Helm is a tool that streamlines installing and managing Kubernetes applications. Although helm you can easy and quickly enjoy tianji in kubernetes.

## Add repo

At first, you should add msgbyte charts registry into helm repo list.

```bash
helm repo add msgbyte https://msgbyte.github.io/charts
```

Now you can search tianji with `helm search` command.

```bash
helm search repo tianji
```

## Install 

Then, feel free to install with one command:

```bash
helm install tianji msgbyte/tianji
```

Its will bring you a pg database and tianji.
