---
sidebar_position: 1
_i18n_hash: be40481b428c406d4fdaf208c202a926
---
# Enrutador de IA

El Enrutador de IA proporciona un único punto de acceso estable para un grupo de Puertas de Enlace de IA. Dirige cada solicitud a través de rutas de puerta de enlace configuradas, distribuye el tráfico por peso dentro del mismo nivel y se apoya en el siguiente nivel cuando ocurren fallos recuperables.

Úsalo cuando quieras:

- Un único punto de acceso para tu aplicación en lugar de codificar de manera fija un proveedor de IA.
- División del tráfico ponderada a través de múltiples puertas de enlace.
- Respaldo de un proveedor principal a proveedores de respaldo durante interrupciones o límites de tasa.
- Una ruta de migración donde puedas mover tráfico gradualmente cambiando los pesos.

## Relación con la Puerta de Enlace de IA

La Puerta de Enlace de IA sigue siendo la unidad que almacena las credenciales del proveedor, URLs base personalizadas, precios de modelos, alertas de cuota y registros de puerta de enlace. El Enrutador de IA no reemplaza eso.

El Enrutador de IA solo decide qué ruta de puerta de enlace debe recibir la solicitud.

El flujo en tiempo de ejecución es:

1. Tu aplicación llama a un punto de acceso de Enrutador de IA.
2. El Enrutador de IA encuentra el enrutador por ID de espacio de trabajo y ID de enrutador.
3. El Enrutador de IA elige una ruta de puerta de enlace elegible del primer nivel.
4. La Puerta de Enlace de IA seleccionada envía la solicitud al proveedor de IA de nivel superior.
5. Si el intento tiene éxito, el Enrutador de IA devuelve esa respuesta.
6. Si el intento falla con un error recuperable, el Enrutador de IA intenta otra ruta en el mismo nivel, luego en el siguiente nivel.

## Requisitos previos

Antes de agregar rutas, crea al menos una Puerta de Enlace de IA con una clave de API de modelo almacenada. Las puertas de enlace sin una clave almacenada no se muestran en el selector de rutas del Enrutador de IA.

Las solicitudes en tiempo de ejecución todavía necesitan una clave de API de Tianji:

- Para puntos de acceso compatibles con OpenAI, envía `Authorization: Bearer <YOUR_TIANJI_API_KEY>`.
- Para puntos de acceso de Mensajes de Anthropic, envía `x-api-key: <YOUR_TIANJI_API_KEY>`.

Tianji verifica la clave de API del llamante, luego usa la clave del proveedor de Puerta de Enlace de IA almacenada para la solicitud de nivel superior.

## Crear un enrutador

1. Abre **AI Router** en la barra lateral de Tianji.
2. Haz clic en **Add AI Router**.
3. Introduce un nombre para el enrutador.
4. Mantén **Habilitado** activado si el enrutador debe aceptar tráfico de tiempo de ejecución.
5. Guarda el enrutador.

Después de crear el enrutador, abre la pestaña **Routes** para configurar niveles y rutas de puerta de enlace.

## Niveles

Un nivel es un nivel de respaldo.

Las solicitudes siempre comienzan en el primer nivel. Si ocurre un fallo recuperable, el Enrutador de IA sigue intentando rutas elegibles en ese nivel. Si todas las rutas elegibles en el nivel fallan, el Enrutador de IA se mueve al siguiente nivel.

Usa múltiples niveles cuando desees un orden de respaldo estricto.

Ejemplo:

| Nivel | Rutas | Significado |
| --- | --- | --- |
| Nivel 1 | OpenAI principal, OpenRouter principal | Tráfico normal de producción |
| Nivel 2 | DeepSeek de respaldo | Respaldo después de que fallan los proveedores principales |
| Nivel 3 | Modelo interno personalizado | Respaldo de último recurso |

Arrastra los niveles para reorganizarlos. El nivel superior se intenta primero.

## Pesos dentro de un nivel

Las rutas dentro del mismo nivel no tienen un orden fijo. Comparten el tráfico por peso.

Ejemplo:

| Ruta | Peso | Porcentaje aproximado de primer intento |
| --- | ---: | ---: |
| Puerta de Enlace A | 80 | 80% |
| Puerta de Enlace B | 20 | 20% |

Esto es útil para:

- División aleatoria del tráfico entre proveedores.
- Migración gradual de un proveedor a otro.
- Prueba de una nueva puerta de enlace con un pequeño porcentaje de tráfico.

Si necesitas un orden estricto, coloca las rutas en diferentes niveles en lugar de en el mismo nivel.

## Agregar una ruta de puerta de enlace

En la pestaña **Routes**:

1. Haz clic en **Add Gateway** dentro de un nivel.
2. Selecciona una Puerta de Enlace de IA existente.
3. Selecciona el modo de proveedor para esta ruta.
4. Configura las opciones de la ruta.
5. Guarda.

Puedes editar o eliminar una ruta más tarde desde la tarjeta de ruta.

### Proveedor

El proveedor controla cómo el Enrutador de IA llama a la Puerta de Enlace de IA seleccionada para esta ruta. La misma Puerta de Enlace de IA puede usarse en diferentes rutas con diferentes modos de proveedor si eso coincide con tu configuración.

Valores de proveedor compatibles:

- `openai`
- `deepseek`
- `anthropic`
- `openrouter`
- `custom`

Para `custom`, el Enrutador de IA utiliza la configuración del modelo personalizado almacenado en la Puerta de Enlace de IA seleccionada, como URL base personalizada y nombre de modelo personalizado.

### Peso

El peso controla cómo se distribuye el tráfico entre las rutas en el mismo nivel. Un peso más alto significa que es más probable que la ruta se intente primero.

Predeterminado: `100`.

### Sobrescribir Modelo

Sobrescribir Modelo es opcional.

Cuando se establece, el Enrutador de IA reemplaza el `modelo` de la solicitud con este valor antes de enviar la solicitud a la ruta de puerta de enlace seleccionada. Déjalo vacante si la solicitud de la aplicación debe decidir el modelo.

### Tiempo de Expiración

El tiempo de expiración es el tiempo máximo para un intento de puerta de enlace.

Predeterminado: `30000ms`.

Si el intento se agota, el Enrutador de IA lo trata como recuperable y puede intentar la siguiente ruta elegible.

### Códigos de Estado Recuperables

El Enrutador de IA siempre trata los errores de red, tiempos de espera y estos códigos de estado como recuperables:

- `429`
- `500`
- `502`
- `503`
- `504`

Usa **Códigos de Estado Recuperables** para agregar más códigos de estado para una ruta. Por ejemplo, puedes agregar `408` si un proveedor informa a menudo un tiempo de espera de solicitud como respuesta HTTP.

Ten cuidado con los errores de validación como `400` o `401`. Por lo general, significan que la solicitud o la clave son incorrectas, y volver a intentar con otro proveedor puede ocultar el problema real.

## Registros

La pestaña **Logs** muestra los intentos de tiempo de ejecución para un enrutador:

- Estado: `Éxito`, `Fallido` o `Parcial`.
- Protocolo: el protocolo de solicitud coincidente.
- Intentos: cuántas rutas de puerta de enlace se intentaron.
- Puerta de Enlace Final: la puerta de enlace que produjo el resultado final.
- Registro de Puerta de Enlace Final: el ID de registro de Puerta de Enlace de IA vinculado.
- Duración.

Usa los registros del enrutador para comprender el comportamiento de conmutación por error. Usa los registros de AI Gateway vinculados para inspeccionar el uso de tokens, los detalles del modelo de nivel superior, el costo y los datos de respuesta del proveedor.
