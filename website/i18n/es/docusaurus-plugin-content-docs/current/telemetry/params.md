---
sidebar_position: 2
_i18n_hash: ca2b25a29f0f1a82407be367a1d03553
---
# Parámetros

Aquí hay un ejemplo de cómo usar y configurar con imagen de telemetría.

Todo es opcional. Mejorará su uso en diferentes lugares.

| nombre | descripción |
| -------- | --------- |
| url | por defecto obtendrá la URL de referencia que genera automáticamente el navegador, pero en algunos sitios web no se permitirá llevar este encabezado, por lo que tendrá que proporcionarlo usted mismo. Si Tianji no puede obtener la URL de ninguna parte, el sistema la ignorará y no registrará esta visita |
| name | define el nombre del evento de telemetría, se puede usar para distinguir diferentes eventos pero en el mismo registro de telemetría. |
| title | **[Solo Insignia]**, define el título de la insignia |
| start | **[Solo Insignia]**, define el número de inicio de cuenta de la insignia |
| fullNum | **[Solo Insignia]**, define si la insignia mostrará el número completo, por defecto son dígitos abreviados (por ejemplo: `12345` y `12.3k`) |

## Cómo usar

Es fácil llevar parámetros en la URL

por ejemplo:

```
https://tianji.example.com/telemetry/<workspaceId>/<telemetryId>/badge.svg?name=myEvent&url=https://google.com&title=My+Counter&start=100000&fullNum=true
```

Si no está familiarizado con esto, puede consultar la página de wiki sobre esto: [https://en.wikipedia.org/wiki/Query_string](https://en.wikipedia.org/wiki/Query_string)
