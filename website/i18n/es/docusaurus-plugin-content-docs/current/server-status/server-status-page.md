---
sidebar_position: 2
_i18n_hash: cecc3b1b7eb92c03797671e2ab259486
---
# Página de estado del servidor

Puedes crear una página de estado del servidor para mostrar el estado de tu servidor al público, lo cual permite que otros lo sepan.

## Configurar dominio personalizado

Puedes configurar tu página de estado en tu propio dominio, por ejemplo: `status.example.com`

Configúralo en la configuración de página y crea un registro `CNAME` en tu panel de control DNS.

```
CNAME status.example.com tianji.example.com
```

Luego podrás visitar `status.example.com` para acceder a tu página.

### Solución de problemas

Si aparece un error 500, es probable que tu Proxy Reverso no esté configurado correctamente.

Por favor, asegúrate de que tu proxy reverso incluya tu nueva ruta de estado.

Por ejemplo:
```
server {
  listen 80;
  server_name tianji.example.com status.example.com;
  listen 443 ssl;
}
```
