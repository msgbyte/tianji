---
sidebar_position: 1
_i18n_hash: b3805dea583e9b96a5bf32e57ff9c130
---
# Script personalizado

En comparación con los servicios de monitoreo tradicionales, **Tianji** admite scripts personalizados para respaldar escenarios más personalizados.

Esencialmente, se puede entender como un entorno de ejecución de JavaScript restringido y seguro para la memoria que acepta un número para mostrar en su gráfico. El escenario más común es el tiempo requerido para que las solicitudes de red accedan a una URL. Por supuesto, también puede referirse a otras cosas, como su saldo de OpenAI, el número de estrellas en su repositorio de GitHub y toda la información que se puede expresar en números.

Si este script devuelve -1, esto significa que el trabajo ha fallado e intenta enviar una notificación, tal como un monitor normal.

Si desea ver la tendencia de los cambios de un número, abrir el modo de tendencias puede ayudarle a descubrir mejor los cambios sutiles en el número.

Aquí hay algunos ejemplos:

## Ejemplos

### Obtener el número de servicios disponibles de tailchat desde el endpoint de salud

```js
const res = await request({
  url: 'https://<tailchat-server-api>/health'
})

if(!res || !res.data || !res.data.services) {
  return -1
}

return res.data.services.length
```

### Obtener el conteo de estrellas en GitHub

```js
const res = await request({
  url: 'https://api.github.com/repos/msgbyte/tianji'
})

return res.data.stargazers_count ?? -1
```

reemplaza `msgbyte/tianji` por el nombre de tu propio repositorio

### Obtener el conteo de descargas en Docker

```js
const res = await request({
  url: "https://hub.docker.com/v2/repositories/moonrailgun/tianji/"
});

return res.data.pull_count;
```

reemplaza `moonrailgun/tianji` por el nombre de tu propia imagen

### Ejemplo para machear texto

```js
const start = Date.now();
const res = await request({
  url: "https://example.com/"
});

const usage = Date.now() - start;

const matched = /maintain/.test(String(res.data));

if(matched) {
  return -1;
}

return usage;
```

devolver `-1` significa que algo está mal. En este caso, significa que el cuerpo HTML incluye el texto `maintain`.

### o más

Muy bienvenidos sean sus scripts en esta página. Tianji es impulsado por la comunidad de código abierto.
