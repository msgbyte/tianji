---
sidebar_position: 1
_i18n_hash: 3bea21234680fc0342392f5d9887ba15
---
# Integración con la Habilidad del Agente

## Introducción

La **Habilidad de Consulta de Datos Tianji** es un conjunto de habilidades ligero y agnóstico al agente que permite a los agentes de IA (Cursor, Claude Code, Codex, Copilot CLI, etc.) consultar la plataforma Tianji directamente a través de su OpenAPI solo de lectura.

Sigue la especificación de [agentskills.io](https://agentskills.io/specification), consistente en un solo `SKILL.md` más archivos de referencia. Sin procesos de larga duración, sin runtime adicional.

:::tip Comienza
Consulta la [Guía de Instalación](./installation.md) para la configuración en un clic o manual.
:::

**Lo que cubre:** 69 endpoints GET en 14 dominios de servicio:

- **Website** — estadísticas de tráfico, vistas de página, distribución geográfica, informes de Lighthouse
- **Monitor** — estado de tiempo de actividad, datos de verificación recientes, eventos de monitoreo
- **Survey** — respuestas de encuestas, estadísticas de resultados, categorías de IA
- **Telemetry** — conteos de eventos personalizados, vistas de página de telemetría, métricas
- **Feed** — canales, flujos de eventos, estados de alimentación
- **Application** — reseñas de tiendas de aplicaciones, información de la aplicación, estadísticas de eventos
- **Facturación / Gateway de IA / Trabajador / Página / Espacio de trabajo / Global / AuditLog**

## Habilidad vs Servidor MCP

Tianji ofrece dos formas de integrarse con agentes de IA. Elige la que se ajuste a tu flujo de trabajo:

| | Habilidad del Agente | [Servidor MCP](/docs/mcp) |
|--|--|--|
| **Forma** | Archivos de documentación simple (`SKILL.md` + referencias) | Un proceso de Node.js de larga duración |
| **Tiempo de ejecución** | Ninguno — el agente utiliza `curl` o herramientas HTTP integradas | `npx tianji-mcp-server` |
| **Cobertura** | 69 endpoints GET (solo lectura, superficie completa) | Un subconjunto curado de herramientas (lectura + algunas escrituras) |
| **Configuración** | Coloca los archivos en el directorio de habilidades del agente | Agrega configuración MCP al archivo de configuración del agente |
| **Mejor para** | Cursor / Claude Code / Codex / cualquier agente que siga la especificación agentskills.io | Agentes con soporte MCP de primera clase |

Puedes utilizar ambos al mismo tiempo sin conflicto.

## Ejemplos de Uso

Una vez instalado, puedes hacer preguntas en lenguaje natural a tu agente de IA y elegirá el endpoint correcto:

### Ejemplo 1: Visión general del tráfico del sitio web

```
Usuario: Muéstrame las vistas de página de mi sitio web principal en los últimos 7 días.

Agente: [Llama a GET /open/workspace/{workspaceId}/website/all para encontrar el sitio]
       [Luego GET /open/workspace/{workspaceId}/website/{websiteId}/pageviews
        con startAt/endAt cubriendo 7 días]
       Tu sitio web principal recibió 12,438 vistas de página en los últimos 7 días,
       con un pico de 2,103 el martes. Principal referente: google.com (43%).
```

### Ejemplo 2: Verificación de salud del monitor

```
Usuario: ¿Alguno de mis monitores está caído ahora mismo?

Agente: [Llama a GET /open/workspace/{workspaceId}/monitor/all]
       [Luego GET /open/workspace/{workspaceId}/monitor/{monitorId}/status
        para cada monitor]
       2 monitores están actualmente CAÍDOS:
       - api.example.com (HTTP 503, última vez ARRIBA hace 12 min)
       - db-replica (timeout TCP, última vez ARRIBA hace 1h)
       Los otros 8 monitores están en buen estado.
```

### Ejemplo 3: Análisis de resultados de encuestas

```
Usuario: Resume las respuestas de la encuesta "Retroalimentación de Clientes del Q4".

Agente: [Llama a GET /open/workspace/{workspaceId}/survey/all para resolver el ID]
       [Luego GET /open/workspace/{workspaceId}/survey/{surveyId}/stats]
       [Luego GET /open/workspace/{workspaceId}/survey/{surveyId}/result/list
        con un cursor de paginación]
       "Retroalimentación de Clientes del Q4" recibió 218 respuestas. Satisfacción promedio
       4.3/5. Tema principal: rendimiento del panel (mencionado 47 veces). Función más
       solicitada: modo oscuro (31 menciones).
```

## Manejo de Datos Sensibles

Algunos endpoints pueden devolver secretos almacenados en la plataforma (por ejemplo, `modelApiKey`, `customModelBaseUrl` en respuestas del Gateway de IA) o PII (miembros del espacio de trabajo, registros de auditoría, facturación).

La habilidad instruye a los agentes a:

- **Nunca mostrar** campos `apiKey`, `modelApiKey`, `secret`, `token`, `password` o `credential`.
- **Redactar u omitir** estos campos al resumir respuestas.
- Para miembros del espacio de trabajo / registros de auditoría, solo mostrar metadatos no sensibles (nombres, roles, marcas de tiempo) a menos que el usuario solicite explícitamente detalles completos.

El `openapi-readonly.json` incluido también pre-redacta estos campos a nivel de esquema, por lo que los agentes no pueden confiar accidentalmente en su estructura.

## Fuente

La fuente de la habilidad se encuentra en el repositorio de Tianji bajo [`skills/tianji-data-query/`](https://github.com/msgbyte/tianji/tree/master/skills/tianji-data-query). Se aceptan pull requests.
