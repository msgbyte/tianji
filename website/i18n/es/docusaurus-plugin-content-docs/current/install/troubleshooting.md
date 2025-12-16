---
sidebar_position: 100
_i18n_hash: 2419750faca3b35056a24bc0a5e02a22
---
# Solución de problemas

Este documento recopila problemas comunes y sus soluciones que puede encontrar al usar Tianji.

## Problemas de conexión de WebSocket

### Descripción del problema

Al usar servicios HTTPS, otras funciones funcionan normalmente, pero el servicio de WebSocket no puede conectarse correctamente, lo que se manifiesta como:

- El indicador de estado de conexión en la esquina inferior izquierda muestra gris
- La lista de páginas del servidor muestra conteos pero no contenido real

### Causa raíz

Este problema generalmente es causado por políticas de reenvío de WebSocket inadecuadas en el software de proxy inverso. En entornos HTTPS, las conexiones de WebSocket requieren políticas de seguridad de cookies correctas.

### Solución

Puede resolver este problema configurando la siguiente variable de entorno:

```bash
AUTH_USE_SECURE_COOKIES=true
```

Esta configuración obliga a la aplicación a tratar las cookies pasadas por el navegador como cookies encriptadas, resolviendo así los problemas de conexión de WebSocket.

#### Métodos de configuración

**Entorno Docker:**
```yaml
# docker-compose.yml
services:
  tianji:
    environment:
      - AUTH_USE_SECURE_COOKIES=true
```

**Despliegue directo:**
```bash
export AUTH_USE_SECURE_COOKIES=true
```

### Pasos de verificación

Después de la configuración, reinicie el servicio y verifique:

1. El indicador de estado de conexión en la esquina inferior izquierda debería mostrar verde.
2. Las páginas del servidor deberían mostrar datos en tiempo real normalmente.
3. Las conexiones de WebSocket deberían establecerse correctamente en las herramientas de desarrollador del navegador.

---

*Si encuentra otros problemas, no dude en enviar un [Issue](https://github.com/msgbyte/tianji/issues) o contribuir con soluciones a esta documentación.*
