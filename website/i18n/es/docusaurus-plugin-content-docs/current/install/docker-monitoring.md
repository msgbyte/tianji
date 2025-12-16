---
sidebar_position: 20
_i18n_hash: e85199043ed7e89d1e71ea95a75b08df
---

# Configuración de Monitoreo de Contenedores Docker

## Comportamiento de Monitoreo Predeterminado

Cuando instalas Tianji usando Docker o Docker Compose, el sistema habilita automáticamente la funcionalidad de monitoreo del servidor incorporada. Por defecto:

- **Tianji monitorea automáticamente el uso de recursos del sistema de su propio contenedor**
- Los datos de monitoreo incluyen: uso de CPU, uso de memoria, uso de disco, tráfico de red, etc.
- Estos datos se informan automáticamente al espacio de trabajo predeterminado sin configuración adicional
- El contenedor aparecerá como `tianji-container` en el panel de monitoreo

## Monitoreo de Todos los Servicios Docker en la Máquina Host

Si deseas que Tianji monitoree todos los contenedores y servicios Docker que se ejecutan en la máquina host, no solo Tianji, necesitas mapear el Socket de Docker dentro del contenedor.

### Método de Configuración

Agrega la siguiente configuración de volúmenes a la sección del servicio `tianji` en tu archivo `docker-compose.yml`:

```yaml
services:
  tianji:
    image: moonrailgun/tianji
    # ... otras configuraciones ...
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    # ... otras configuraciones ...
```

### Ejemplo Completo de docker-compose.yml

```yaml
version: '3'
services:
  tianji:
    image: moonrailgun/tianji
    build:
      context: ./
      dockerfile: ./Dockerfile
    ports:
      - "12345:12345"
    environment:
      DATABASE_URL: postgresql://tianji:tianji@postgres:5432/tianji
      JWT_SECRET: replace-me-with-a-random-string
      ALLOW_REGISTER: "false"
      ALLOW_OPENAPI: "true"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # Agrega esta línea
    depends_on:
      - postgres
    restart: always
  postgres:
    # ... configuración de postgres ...
```

### Usando el Comando Docker Run

Si inicias Tianji usando el comando `docker run`, puedes agregar el siguiente parámetro:

```bash
docker run -d \
  --name tianji \
  -p 12345:12345 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  moonrailgun/tianji
```

## Efectos Después de la Configuración

Después de agregar el mapeo del Socket de Docker, Tianji podrá:

- Monitorear todos los contenedores Docker que se ejecutan en la máquina host
- Obtener información sobre el uso de recursos de los contenedores
- Mostrar información sobre el estado de los contenedores
- Proporcionar una vista de monitoreo del sistema más completa
