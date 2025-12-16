---
sidebar_position: 2
_i18n_hash: 8142a07cc46361e9e72d8c883ab7869a
---
# Instalación en Traefik con complemento

Tianji ofrece un complemento para Traefik que te permite integrar fácilmente la funcionalidad de análisis web de Tianji en tu proxy Traefik.

## Resumen del Complemento

[traefik-tianji-plugin](https://github.com/msgbyte/traefik-tianji-plugin) es un middleware plugin de Traefik desarrollado específicamente para Tianji, que puede inyectar automáticamente el script de seguimiento de Tianji en tu sitio web sin modificar el código del sitio para empezar a recopilar datos de visitantes.

## Instalación del Complemento

### 1. Añadir el Complemento en la Configuración Estática

Primero, necesitas añadir la referencia del complemento en la configuración estática de Traefik. El número de versión del complemento hace referencia a la etiqueta git.

#### Configuración YAML

Añade lo siguiente a tu `traefik.yml` o archivo de configuración estática:

```yaml
experimental:
  plugins:
    traefik-tianji-plugin:
      moduleName: "github.com/msgbyte/traefik-tianji-plugin"
      version: "v0.2.1"
```

#### Configuración TOML

```toml
[experimental.plugins.traefik-tianji-plugin]
  moduleName = "github.com/msgbyte/traefik-tianji-plugin"
  version = "v0.2.1"
```

#### Línea de Comando

```bash
--experimental.plugins.traefik-tianji-plugin.modulename=github.com/msgbyte/traefik-tianji-plugin
--experimental.plugins.traefik-tianji-plugin.version=v0.2.1
```

### 2. Configurar el Middleware

Después de instalar el complemento, necesitas configurar el middleware en la configuración dinámica.

#### Configuración Dinámica YAML

En tu archivo `config.yml` o de configuración dinámica:

```yaml
http:
  middlewares:
    my-tianji-middleware:
      plugin:
        traefik-tianji-plugin:
          tianjiHost: "https://tianji.tu-dominio.com"
          websiteId: "tu-id-de-website"
```

#### Configuración Dinámica TOML

```toml
[http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin]
  tianjiHost = "https://tianji.tu-dominio.com"
  websiteId = "tu-id-de-website"
```

#### Etiquetas Docker Compose

```yaml
version: '3.7'
services:
  my-app:
    image: nginx:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.my-app.rule=Host(`my-app.local`)"
      - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.tianjiHost=https://tianji.tu-dominio.com"
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.websiteId=tu-id-de-website"
```

## Parámetros de Configuración

### Parámetros Requeridos

- **tianjiHost**: La URL completa de tu servidor Tianji
  - Ejemplo: `https://tianji.tu-dominio.com`
  - Si usas el servicio oficial alojado: `https://app-tianji.msgbyte.com`

- **websiteId**: El ID del sitio web creado en Tianji
  - Se puede encontrar en la configuración del sitio web de tu panel de administración de Tianji.

### Parámetros Opcionales

El complemento también soporta otros parámetros de configuración para personalizar el comportamiento. Para parámetros específicos, consulta la [documentación del repositorio de GitHub](https://github.com/msgbyte/traefik-tianji-plugin).

## Uso del Middleware

Después de la configuración, necesitas usar este middleware en tu router:

### Configuración YAML

```yaml
http:
  routers:
    my-app:
      rule: "Host(`my-app.local`)"
      middlewares:
        - "my-tianji-middleware"
      service: "my-app-service"
```

### Etiquetas Docker Compose

```yaml
labels:
  - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
```

## Cómo Funciona

1. Cuando las solicitudes pasan a través del proxy Traefik, el complemento verifica el contenido de la respuesta.
2. Si la respuesta es contenido HTML, el complemento inyecta automáticamente el script de seguimiento de Tianji.
3. El script empieza a recopilar datos de visitantes y los envía al servidor Tianji cuando se carga la página.

## Notas Importantes

- Asegúrate de que la dirección del servidor Tianji sea accesible desde los navegadores de los clientes.
- El ID del sitio web debe ser válido, de lo contrario, los datos no se podrán recopilar correctamente.
- El complemento solo surtirá efecto cuando el tipo de contenido de la respuesta sea HTML.
- Se recomienda usar la última versión del complemento para obtener un rendimiento óptimo y características actualizadas.

## Referencia

- [Código Fuente del Complemento](https://github.com/msgbyte/traefik-tianji-plugin)
- [Documentación de Complementos de Traefik](https://doc.traefik.io/traefik/plugins/)
