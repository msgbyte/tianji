---
sidebar_position: 2
_i18n_hash: f85f95f54fdfadadf81712ccb1401e46
---
# Instalación en Traefik con plugin

Tianji proporciona un plugin para Traefik que permite integrar fácilmente la funcionalidad de análisis web de Tianji en su proxy Traefik.

## Resumen del Plugin

[traefik-tianji-plugin](https://github.com/msgbyte/traefik-tianji-plugin) es un middleware de Traefik desarrollado específicamente para Tianji, que puede inyectar automáticamente el script de seguimiento de Tianji en su sitio web sin modificar el código del sitio para comenzar a recopilar datos de los visitantes.

## Instalación del Plugin

### 1. Agregar el Plugin en la Configuración Estática

Primero, debe agregar la referencia del plugin en la configuración estática de Traefik. El número de versión del plugin hace referencia a la etiqueta de git.

#### Configuración YAML

Agregue lo siguiente a su archivo `traefik.yml` o archivo de configuración estática:

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

### 2. Configurar Middleware

Después de instalar el plugin, debe configurar el middleware en la configuración dinámica.

#### Configuración Dinámica YAML

En su archivo `config.yml` o archivo de configuración dinámica:

```yaml
http:
  middlewares:
    my-tianji-middleware:
      plugin:
        traefik-tianji-plugin:
          tianjiHost: "https://tianji.your-domain.com"
          websiteId: "your-website-id"
```

#### Configuración Dinámica TOML

```toml
[http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin]
  tianjiHost = "https://tianji.your-domain.com"
  websiteId = "your-website-id"
```

#### Etiquetas de Docker Compose

```yaml
version: '3.7'
services:
  my-app:
    image: nginx:latest
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.my-app.rule=Host(`my-app.local`)"
      - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.tianjiHost=https://tianji.your-domain.com"
      - "traefik.http.middlewares.my-tianji-middleware.plugin.traefik-tianji-plugin.websiteId=your-website-id"
```

## Parámetros de Configuración

### Parámetros Requeridos

- **tianjiHost**: La URL completa de su servidor Tianji
  - Ejemplo: `https://tianji.your-domain.com`
  - Si utiliza el servicio oficial hospedado: `https://app.tianji.dev`

- **websiteId**: El ID del sitio web creado en Tianji
  - Se puede encontrar en la configuración del sitio web de su panel de administración de Tianji

### Parámetros Opcionales

El plugin también soporta otros parámetros de configuración para personalizar el comportamiento. Para parámetros específicos, por favor consulte la [documentación del repositorio en GitHub](https://github.com/msgbyte/traefik-tianji-plugin).

## Uso del Middleware

Después de la configuración, necesita usar este middleware en su enrutador:

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

### Etiquetas de Docker Compose

```yaml
labels:
  - "traefik.http.routers.my-app.middlewares=my-tianji-middleware"
```

## Cómo Funciona

1. Cuando las solicitudes pasan a través del proxy Traefik, el plugin verifica el contenido de la respuesta.
2. Si la respuesta es contenido HTML, el plugin inyecta automáticamente el script de seguimiento de Tianji.
3. El script comienza a recopilar datos de los visitantes y los envía al servidor Tianji al cargar la página.

## Notas Importantes

- Asegúrese de que la dirección del servidor Tianji sea accesible desde los navegadores de los clientes.
- El ID del sitio web debe ser válido, de lo contrario, los datos no se podrán recopilar correctamente.
- El plugin solo surte efecto cuando el tipo de contenido de la respuesta es HTML.
- Se recomienda usar la última versión del plugin para un rendimiento y características óptimas.

## Referencia

- [Código Fuente del Plugin](https://github.com/msgbyte/traefik-tianji-plugin)
- [Documentación de Plugins de Traefik](https://doc.traefik.io/traefik/plugins/)
