---
sidebar_position: 1
_i18n_hash: c95e9693eac4df676574d4eb8357881d
---
# Instalación en Helm

Helm es una herramienta que simplifica la instalación y gestión de aplicaciones en Kubernetes. Con Helm, puedes disfrutar de Tianji en Kubernetes de manera fácil y rápida.

## Añadir el repositorio

Primero, debes agregar el registro de gráficos de msgbyte en la lista de repositorios de Helm.

```bash
helm repo add msgbyte https://msgbyte.github.io/charts
```

Ahora puedes buscar Tianji con el comando `helm search`.

```bash
helm search repo tianji
```

## Instalación

Luego, siéntete libre de instalarlo con un solo comando:

```bash
helm install tianji msgbyte/tianji
```

Esto te proporcionará una base de datos pg y Tianji.
