---
sidebar_position: 1
_i18n_hash: 50d592e977b3f195d40bd2931b68269b
---
# Integración con MCP

<a href="https://cursor.com/install-mcp?name=tianji&config=eyJ0eXBlIjoic3RkaW8iLCJjb21tYW5kIjoibnB4IC15IHRpYW5qaS1tY3Atc2VydmVyIiwiZW52Ijp7IlRJQU5KSV9CQVNFX1VSTCI6IiIsIlRJQU5KSV9BUElfS0VZIjoiIiwiVElBTkpJX1dPUktTUEFDRV9JRCI6IiJ9fQ%3D%3D"><em><img src="https://cursor.com/deeplink/mcp-install-light.svg" alt="Añadir servidor tianji MCP a Cursor" height="32" /></em></a>
<br />
[![Añadir a Kiro](https://kiro.dev/images/add-to-kiro.svg)](https://kiro.dev/launch/mcp/add?name=tianji&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22tianji-mcp-server%22%5D%2C%22env%22%3A%7B%22TIANJI_BASE_URL%22%3A%22https%3A%2F%2Ftianji.example.com%22%2C%22TIANJI_API_KEY%22%3A%22%3Cyour-api-key%3E%22%2C%22TIANJI_WORKSPACE_ID%22%3A%22%3Cyour-workspace-id%3E%22%7D%7D)

## Introducción

El servidor Tianji MCP es un servidor basado en el Protocolo de Contexto de Modelo (MCP) que sirve como puente entre asistentes de IA y la plataforma Tianji. Expone la funcionalidad de encuestas de la plataforma Tianji a los asistentes de IA a través del protocolo MCP. Este servidor proporciona las siguientes características principales:

- Consultar resultados de encuestas
- Obtener información detallada de encuestas
- Obtener todas las encuestas en un espacio de trabajo
- Obtener lista de sitios web

## Métodos de Instalación

### Instalación con NPX

Puedes usar el servidor Tianji MCP añadiendo la siguiente configuración al archivo de configuración de tu asistente de IA:

```json
{
  "mcpServers": {
    "tianji": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "tianji-mcp-server"
      ],
      "env": {
        "TIANJI_BASE_URL": "https://tianji.example.com",
        "TIANJI_API_KEY": "<your-api-key>",
        "TIANJI_WORKSPACE_ID": "<your-workspace-id>"
      }
    }
  }
}
```

### Configuración de Variables de Entorno

Antes de usar el servidor Tianji MCP, necesitas configurar las siguientes variables de entorno:

```bash
# URL base de la API de la plataforma Tianji
TIANJI_BASE_URL=https://tianji.example.com

# Clave API de la plataforma Tianji
TIANJI_API_KEY=your_api_key_here

# ID del espacio de trabajo de la plataforma Tianji
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### Obtener una Clave API

Puedes obtener una clave API de la plataforma Tianji siguiendo estos pasos:

1. Después de iniciar sesión en la plataforma Tianji, haz clic en tu **foto de perfil** en la esquina superior derecha
2. Selecciona **Perfil** en el menú desplegable
3. En la página de perfil, encuentra la opción **Claves API**
4. Haz clic en crear nueva clave y sigue las indicaciones para completar la creación de la clave

## Instrucciones de Uso

El servidor Tianji MCP proporciona una serie de herramientas que pueden interactuar con los asistentes de IA a través del protocolo MCP. A continuación se detallan las descripciones de cada herramienta:

### Consultar Resultados de Encuestas

Utiliza la herramienta `tianji_get_survey_results` para consultar los datos de resultados de una encuesta específica.

**Parámetros:**

- `workspaceId`: ID del espacio de trabajo de Tianji (por defecto al valor configurado en variables de entorno)
- `surveyId`: ID de la encuesta
- `limit`: Límite en el número de registros devueltos (por defecto 20)
- `cursor`: Cursor de paginación (opcional)
- `startAt`: Hora de inicio, formato ISO, ejemplo: 2023-10-01T00:00:00Z
- `endAt`: Hora de fin, formato ISO, ejemplo: 2023-10-31T23:59:59Z
- `filter`: Condiciones de filtrado (opcional)

### Obtener Información de la Encuesta

Utiliza la herramienta `tianji_get_survey_info` para obtener información básica sobre una encuesta específica.

**Parámetros:**

- `workspaceId`: ID del espacio de trabajo de Tianji (por defecto al valor configurado en variables de entorno)
- `surveyId`: ID de la encuesta

### Obtener Lista de Todas las Encuestas

Utiliza la herramienta `tianji_get_all_survey_list` para obtener una lista de todas las encuestas en el espacio de trabajo.

**Parámetros:**

- `workspaceId`: ID del espacio de trabajo de Tianji (por defecto al valor configurado en variables de entorno)

### Obtener Lista de Sitios Web

Utiliza la herramienta `tianji_get_website_list` para obtener una lista de sitios web en el espacio de trabajo.

**Parámetros:**

- `workspaceId`: ID del espacio de trabajo de Tianji (por defecto al valor configurado en variables de entorno)

## Ejemplos de Uso

A continuación se presentan ejemplos de interacciones en lenguaje natural entre usuarios y asistentes de IA integrados con el servidor Tianji MCP:

### Ejemplo 1: Obtener Lista de Todas las Encuestas

```
Usuario: Ayúdame a ver todas mis listas de cuestionarios de encuestas

Asistente de IA: Voy a obtener todas tus listas de cuestionarios de encuestas para ti.
[El Asistente de IA llama a tianji_get_all_survey_list a través del protocolo MCP para obtener datos]
Basado en los datos de tu espacio de trabajo, actualmente tienes las siguientes encuestas:
1. Encuesta de Satisfacción de Experiencia de Usuario (creada el 2023-09-15)
2. Encuesta de Retroalimentación de Funciones del Producto (creada el 2023-10-01)
3. Evaluación de Usabilidad del Sitio Web (creada el 2023-10-20)
```

### Ejemplo 2: Obtener Detalles de una Encuesta Específica

```
Usuario: Por favor dime los detalles de la "Encuesta de Satisfacción de Experiencia de Usuario"

Asistente de IA: Voy a consultar los detalles de esa encuesta para ti.
[El Asistente de IA llama a tianji_get_survey_info a través del protocolo MCP para obtener datos]
Detalles de la "Encuesta de Satisfacción de Experiencia de Usuario":
- Hora de creación: 2023-09-15
- Estado: Activo
- Número de preguntas: 10
- Respuestas recogidas: 128
- Respuesta más reciente: 2023-10-25
```

### Ejemplo 3: Consultar Resultados de Encuestas

```
Usuario: Ayúdame a analizar los resultados de octubre de la "Encuesta de Retroalimentación de Funciones del Producto"

Asistente de IA: Voy a analizar los resultados de octubre de la "Encuesta de Retroalimentación de Funciones del Producto".
[El Asistente de IA llama a tianji_get_survey_results a través del protocolo MCP para obtener datos para el rango de tiempo específico]
Análisis de los resultados de octubre de la "Encuesta de Retroalimentación de Funciones del Producto":
- Total de respuestas: 42
- Función más popular: Informes Automáticos (85% de comentarios positivos)
- Función con mayor necesidad de mejora: Adaptación móvil (mencionada por el 62%)
- Calificación promedio de satisfacción: 4.2/5
- Principales sugerencias de los usuarios: Añadir funcionalidad de exportación de datos, optimizar la velocidad de carga de la página
```
