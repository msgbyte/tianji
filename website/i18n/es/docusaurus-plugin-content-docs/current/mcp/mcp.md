---
sidebar_position: 1
_i18n_hash: bf0ff03e7619ebadc59e7451f16ddf69
---
# Integración con MCP

<a href="https://cursor.com/install-mcp?name=tianji&config=eyJ0eXBlIjoic3RkaW8iLCJjb21tYW5kIjoibnB4IC15IHRpYW5qaS1tY3Atc2VydmVyIiwiZW52Ijp7IlRJQU5KSV9CQVNFX1VSTCI6IiIsIlRJQU5KSV9BUElfS0VZIjoiIiwiVElBTkpJX1dPUktTUEFDRV9JRCI6IiJ9fQ%3D%3D"><em><img src="https://cursor.com/deeplink/mcp-install-light.svg" alt="Agregar servidor MCP de Tianji a Cursor" height="32" /></em></a>

## Introducción

El Servidor MCP de Tianji es un servidor basado en el Protocolo Contextual de Modelo (MCP) que funciona como puente entre asistentes de IA y la plataforma Tianji. Expone la funcionalidad de encuestas de la plataforma Tianji a los asistentes de IA a través del protocolo MCP. Este servidor proporciona las siguientes características básicas:

- Consultar resultados de encuestas
- Obtener información detallada de encuestas
- Obtener todas las encuestas en un espacio de trabajo
- Obtener lista de sitios web

## Métodos de Instalación

### Instalación NPX

Puedes usar el Servidor MCP de Tianji añadiendo la siguiente configuración al archivo de configuración de tu asistente de IA:

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
        "TIANJI_API_KEY": "<tu-clave-api>",
        "TIANJI_WORKSPACE_ID": "<tu-id-de-espacio-de-trabajo>"
      }
    }
  }
}
```

### Configuración de Variables de Entorno

Antes de usar el Servidor MCP de Tianji, necesitas establecer las siguientes variables de entorno:

```bash
# URL base de API de la plataforma Tianji
TIANJI_BASE_URL=https://tianji.example.com

# Clave API de la plataforma Tianji
TIANJI_API_KEY=tu_clave_api_aquí

# ID del espacio de trabajo de la plataforma Tianji
TIANJI_WORKSPACE_ID=tu_id_de_espacio_de_trabajo_aquí
```

### Obtener una Clave API

Puedes obtener una clave API de la plataforma Tianji siguiendo estos pasos:

1. Después de iniciar sesión en la plataforma Tianji, haz clic en tu **foto de perfil** en la esquina superior derecha.
2. Selecciona **Perfil** en el menú desplegable.
3. En la página del perfil, encuentra la opción **Claves API**.
4. Haz clic en crear nueva clave y sigue las indicaciones para completar la creación de la clave.

## Instrucciones de Uso

El Servidor MCP de Tianji ofrece una serie de herramientas que pueden interactuar con asistentes de IA a través del protocolo MCP. A continuación se detallan cada herramienta:

### Consultar Resultados de Encuestas

Usa la herramienta `tianji_get_survey_results` para consultar datos de resultado de una encuesta específica.

**Parámetros:**

- `workspaceId`: ID del espacio de trabajo de Tianji (por defecto el valor configurado en las variables de entorno).
- `surveyId`: ID de la encuesta.
- `limit`: Límite sobre la cantidad de registros devueltos (por defecto 20).
- `cursor`: Cursor de paginación (opcional).
- `startAt`: Hora de inicio, formato ISO, ejemplo: 2023-10-01T00:00:00Z.
- `endAt`: Hora de finalización, formato ISO, ejemplo: 2023-10-31T23:59:59Z.
- `filter`: Condiciones de filtrado (opcional).

### Obtener Información de Encuestas

Usa la herramienta `tianji_get_survey_info` para obtener información básica sobre una encuesta específica.

**Parámetros:**

- `workspaceId`: ID del espacio de trabajo de Tianji (por defecto el valor configurado en las variables de entorno).
- `surveyId`: ID de la encuesta.

### Obtener Lista de Todas las Encuestas

Usa la herramienta `tianji_get_all_survey_list` para obtener una lista de todas las encuestas en el espacio de trabajo.

**Parámetros:**

- `workspaceId`: ID del espacio de trabajo de Tianji (por defecto el valor configurado en las variables de entorno).

### Obtener Lista de Sitios Web

Usa la herramienta `tianji_get_website_list` para obtener una lista de sitios web en el espacio de trabajo.

**Parámetros:**

- `workspaceId`: ID del espacio de trabajo de Tianji (por defecto el valor configurado en las variables de entorno).

## Ejemplos de Uso

A continuación se muestran ejemplos de interacciones en lenguaje natural entre usuarios y asistentes de IA integrados con el Servidor MCP de Tianji:

### Ejemplo 1: Obtener Lista de Todas las Encuestas

```
Usuario: Ayúdame a ver todas mis listas de cuestionarios de encuestas.

Asistente de IA: Obtendré todas tus listas de cuestionarios de encuestas para ti.
[El Asistente de IA llama a tianji_get_all_survey_list a través del protocolo MCP para obtener los datos]
Según los datos en tu espacio de trabajo, actualmente tienes las siguientes encuestas:
1. Encuesta de Satisfacción de Experiencia del Usuario (creada el 2023-09-15)
2. Encuesta de Retroalimentación de Características del Producto (creada el 2023-10-01)
3. Evaluación de Usabilidad del Sitio Web (creada el 2023-10-20)
```

### Ejemplo 2: Obtener Detalles de Encuesta Específica

```
Usuario: Por favor, infórmame los detalles de la "Encuesta de Satisfacción de Experiencia del Usuario".

Asistente de IA: Consultaré los detalles de esa encuesta para ti.
[El Asistente de IA llama a tianji_get_survey_info a través del protocolo MCP para obtener los datos]
Detalles de la "Encuesta de Satisfacción de Experiencia del Usuario":
- Hora de creación: 2023-09-15
- Estado: Activa
- Número de preguntas: 10
- Respuestas recopiladas: 128
- Respuesta más reciente: 2023-10-25
```

### Ejemplo 3: Consultar Resultados de Encuestas

```
Usuario: Ayúdame a analizar los resultados de octubre de la "Encuesta de Retroalimentación de Características del Producto".

Asistente de IA: Analizaré los resultados de octubre de la "Encuesta de Retroalimentación de Características del Producto".
[El Asistente de IA llama a tianji_get_survey_results a través del protocolo MCP para obtener datos para el rango de tiempo específico]
Análisis de los resultados de octubre de la "Encuesta de Retroalimentación de Características del Producto":
- Total de respuestas: 42
- Característica más popular: Informes Automáticos (85% de retroalimentación positiva)
- Característica que más necesita mejora: Adaptación móvil (mencionada por el 62%)
- Valoración promedio de satisfacción: 4.2/5
- Principales sugerencias de los usuarios: Agregar funcionalidad de exportación de datos, optimizar la velocidad de carga de la página
```
