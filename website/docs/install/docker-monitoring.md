---
sidebar_position: 20
---

# Docker Container Monitoring Configuration

## Default Monitoring Behavior

When you install Tianji using Docker or Docker Compose, the system automatically enables built-in server monitoring functionality. By default:

- **Tianji automatically monitors its own container's** system resource usage
- Monitoring data includes: CPU usage, memory usage, disk usage, network traffic, etc.
- This data is automatically reported to the default workspace without additional configuration
- The container will appear as `tianji-container` in the monitoring dashboard

## Monitoring All Docker Services on the Host Machine

If you want Tianji to monitor all Docker containers and services running on the host machine, not just Tianji itself, you need to map the Docker Socket into the container.

### Configuration Method

Add the following volumes configuration to the `tianji` service section in your `docker-compose.yml` file:

```yaml
services:
  tianji:
    image: moonrailgun/tianji
    # ... other configurations ...
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    # ... other configurations ...
```

### Complete docker-compose.yml Example

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
      - /var/run/docker.sock:/var/run/docker.sock  # Add this line
    depends_on:
      - postgres
    restart: always
  postgres:
    # ... postgres configuration ...
```

### Using Docker Run Command

If you start Tianji using the `docker run` command, you can add the following parameter:

```bash
docker run -d \
  --name tianji \
  -p 12345:12345 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  moonrailgun/tianji
```

## Effects After Configuration

After adding the Docker Socket mapping, Tianji will be able to:

- Monitor all Docker containers running on the host machine
- Obtain container resource usage information
- Display container status information
- Provide a more comprehensive system monitoring view
