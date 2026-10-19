---
sidebar_position: 1
_i18n_hash: 479219b036abf3d6006999bf96fd2ea9
---
# Informe de estado del servidor

Puedes informar el estado de tu servidor fácilmente con tianji reporter.

Puedes descargarlo desde [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases)

## Uso

```
Uso de tianji-reporter:
  --interval int
        Ingrese el INTERVALO, en segundos (por defecto 5)
  --mode http
        El modo de envío de los datos de informe, puedes seleccionar: `http` o `udp`, el valor predeterminado es `http` (por defecto "http")
  --name string
        El nombre de identificación para esta máquina
  --url string
        La URL http de tianji, por ejemplo: https://tianji.dev
  --vnstat
        Usar vnstat para estadísticas de tráfico, solo en Linux
  --workspace string
        El id del espacio de trabajo para tianji, esto debe ser un uuid
```

Los campos **url** y **workspace** son obligatorios, significa que informarás tu servicio a qué host y en qué espacio de trabajo.

Por defecto, el nombre del nodo del servidor será el mismo que el nombre del host, así que puedes personalizar tu nombre con `--name`, lo que te ayudará a identificar el servidor.

## Script de instalación automática

Puedes obtener tu script de instalación automática en `Tianji` -> `Servidores` -> `Agregar` -> pestaña `Automático`

Descargará automáticamente el reportero y creará un servicio de Linux en tu máquina, por lo que necesita permisos de root.

### Desinstalación

Si deseas desinstalar el servicio de reporter, puedes usar este comando así:
```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
``` 

El cambio principal es añadir `-s uninstall` a tu comando de instalación.

## Kubernetes

Si tus servidores están ejecutándose en un clúster de Kubernetes, puedes desplegar el reportero como un DaemonSet para que cada nodo informe métricas automáticamente. Consulta [Desplegar Reportero como DaemonSet](./kubernetes/reporter-daemonset.md) para más detalles.

## Preguntas y Respuestas

### ¿Cómo verificar el registro del servicio tianji reporter?

Si instalas con el script de instalación automática, tianji te ayudará a instalar un servicio llamado `tianji-reporter` en tu máquina Linux.

Puedes usar este comando para verificar el registro del reportero tianji:

```bash
journalctl -fu tianji-reporter.service
```

### No encuentro mi máquina en la pestaña de servidores aunque el informe muestra éxito

Tal vez tu tianji esté detrás de un proxy inverso, por ejemplo `nginx`.

Por favor, asegúrate de que tu proxy inverso agregue soporte para websocket.

## ¿Por qué mi máquina siempre está desconectada?

Por favor, verifica la fecha y hora de tu servidor.
