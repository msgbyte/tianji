---
sidebar_position: 2
_i18n_hash: 4ad4885ffd9d3dee0d40df9443ddf820
---
# Instalación

La habilidad consta de solo tres archivos. Cualquier agente de IA moderno (Cursor, Claude Code, Codex, Copilot CLI...) ya sabe dónde está su directorio de habilidades — por lo que la instalación puede ser tan simple como pegar un único mensaje.

## Instalación con un solo clic (a través de un Agente de IA)

Pega el mensaje a continuación en tu agente de IA. Este descargará los archivos en el directorio de habilidades correcto para su plataforma y luego te pedirá cualquier configuración que falte.

```
Por favor, instala la Habilidad de Consulta de Datos Tianji en tu directorio de habilidades:

https://github.com/msgbyte/tianji/tree/master/skills/tianji-data-query

Después de descargar, verifica si se han configurado estas variables de entorno:
  - TIANJI_BASE_URL
  - TIANJI_API_KEY
  - TIANJI_WORKSPACE_ID

Si falta alguna, pídeme los valores.
```

Eso es todo. El agente elige su propio directorio de habilidades, descarga los archivos y te solicita las credenciales cuando es necesario.

## Instalación manual

Si prefieres instalarlo a mano, elige el directorio de destino para tu agente y ejecuta:

```bash
DEST="$HOME/.cursor/skills/tianji-data-query"   # o el que use tu agente
mkdir -p "$DEST/references"

BASE="https://raw.githubusercontent.com/msgbyte/tianji/master/skills/tianji-data-query"
curl -fSL "$BASE/SKILL.md"                          -o "$DEST/SKILL.md"
curl -fSL "$BASE/references/api-endpoints.md"       -o "$DEST/references/api-endpoints.md"
curl -fSL "$BASE/references/openapi-readonly.json"  -o "$DEST/references/openapi-readonly.json"
```

### Directorio de habilidades por agente

| Agente | Directorio |
|--------|------------|
| Cursor (personal) | `~/.cursor/skills/tianji-data-query/` |
| Cursor (proyecto)  | `<project-root>/.cursor/skills/tianji-data-query/` |
| Claude Code       | `~/.claude/skills/tianji-data-query/` |
| Codex             | `~/.codex/skills/tianji-data-query/` |
| Codex (alt)       | `~/.agents/skills/tianji-data-query/` |

## Variables de entorno requeridas

La habilidad espera tres valores. Expórtalos en tu shell rc, o configúralos en la configuración de habilidades de tu agente:

```bash
# URL base de la instancia de Tianji
TIANJI_BASE_URL=https://tianji.example.com

# Clave API para autenticación
TIANJI_API_KEY=tu_clave_api_aquí

# ID del espacio de trabajo predeterminado
TIANJI_WORKSPACE_ID=tu_id_espacio_trabajo_aquí
```

### Obtener una clave API

1. Inicia sesión en tu instancia de Tianji y haz clic en tu **foto de perfil** en la esquina superior derecha.
2. Selecciona **Perfil** en el menú desplegable.
3. Encuentra la sección **Claves API**.
4. Haz clic en **Crear nueva clave** y sigue las instrucciones.

## Próximos pasos

Después de la instalación, regresa a [Integración con Habilidad del Agente](./skill.md) para ver ejemplos de uso, la comparación con el Servidor MCP y cómo la habilidad maneja datos sensibles.
