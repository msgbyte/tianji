---
sidebar_position: 1
_i18n_hash: 21a5dc8265605536c8c328c551abdcc9
---
# Reporte de Estado del Servidor

puedes reportar el estado de tu servidor fácilmente con el reportero de tianji

puedes descargarlo desde [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases)

## Uso

```
Uso de tianji-reporter:
  --interval int
        Ingrese el INTERVALO, segundo (por defecto 5)
  --mode http
        El modo de envío de datos de informe, puedes seleccionar: `http` o `udp`, por defecto es `http` (por defecto "http")
  --name string
        El nombre de identificación para esta máquina
  --url string
        La url http de tianji, por ejemplo: https://tianji.msgbyte.com
  --vnstat
        Usar vnstat para estadísticas de tráfico, solo linux
  --workspace string
        La ID del espacio de trabajo para tianji, esto debe ser un uuid
```

La **url** y el **workspace** son obligatorios, significa que reportarás tu servicio a qué host y a qué espacio de trabajo.

Por defecto, el nombre del nodo del servidor será el mismo que el nombre de host, por lo que puedes personalizar tu nombre con `--name` lo cual puede ayudarte a identificar el servidor.

## Script de instalación automática

Puedes obtener tu script de instalación automática en `Tianji` -> `Servidores` -> `Agregar` -> pestaña `Auto`

Esto descargará automáticamente el reportero y creará un servicio de linux en tu máquina. por eso necesita permisos de root.

### Desinstalar

si deseas desinstalar el servicio de reportero, puedes usar este comando como:

```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
``` 

El cambio principal es agregar `-s uninstall` a tu comando de instalación.

## Kubernetes

Si tus servidores están operando en un clúster de Kubernetes, puedes desplegar el reportero como un DaemonSet para que cada nodo reporte métricas automáticamente. Consulta [Desplegar Reportero como DaemonSet](./kubernetes/reporter-daemonset.md) para más detalles.

## Preguntas y Respuestas

### ¿Cómo verificar el registro del servicio del reportero tianji?

Si instalas con el script de instalación automática, tianji te ayudará a instalar un servicio llamado `tianji-reporter` en tu máquina linux.

Puedes usar este comando para verificar el registro del reportero tianji:

```bash
journalctl -fu tianji-reporter.service
```

### No he encontrado mi máquina en la pestaña de servidores aunque el reporte muestra éxito

Quizás tu tianji está detrás de un proxy inverso, por ejemplo `nginx`.

Asegúrate de que tu proxy inverso agrega soporte para websockets.

## ¿Por qué mi máquina siempre está offline?

Por favor, verifica la fecha y hora de tu servidor.
