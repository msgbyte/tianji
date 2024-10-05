---
sidebar_position: 1
_i18n_hash: c95e9693eac4df676574d4eb8357881d
---
# Installation mit Helm

Helm ist ein Tool, das die Installation und Verwaltung von Kubernetes-Anwendungen vereinfacht. Mit Helm können Sie Tianji in Kubernetes einfach und schnell nutzen.

## Repo hinzufügen

Zunächst sollten Sie das msgbyte Charts-Repository zu Ihrer Helm-Repo-Liste hinzufügen.

```bash
helm repo add msgbyte https://msgbyte.github.io/charts
```

Jetzt können Sie Tianji mit dem Befehl `helm search` suchen.

```bash
helm search repo tianji
```

## Installation

Installieren Sie dann einfach mit einem Befehl:

```bash
helm install tianji msgbyte/tianji
```

Dies bringt Ihnen eine PostgreSQL-Datenbank und Tianji.
