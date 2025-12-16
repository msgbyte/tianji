---
sidebar_position: 2
_i18n_hash: a82bcf148feb70ec31d10a96cffc2795
---
# Autenticación

Este documento proporciona instrucciones detalladas sobre cómo autenticarse con la API de Tianji, incluyendo la obtención, uso y gestión de claves de API.

## Método de Autenticación

La API de Tianji utiliza autenticación **Bearer Token**. Debes incluir tu clave de API en el encabezado HTTP de cada solicitud a la API.

### Formato del Encabezado HTTP

```http
Authorization: Bearer <TU_CLAVE_API>
```

## Obtención de Claves de API

1. Inicia sesión en tu instancia de Tianji
2. Haz clic en tu avatar en la esquina superior derecha
4. Encuentra la sección **Claves de API**
5. Haz clic en el botón + para crear una nueva clave de API
6. Nombra tu clave de API y guárdala

## Gestión de Claves de API

### Ver Claves Existentes

En la sección **Claves de API**, puedes ver:
- Nombre/descripción de la clave de API
- Fecha de creación
- Última fecha de uso
- Estadísticas de conteo de uso

### Eliminar Claves de API

Si necesitas revocar una clave de API:
1. Encuentra la clave de API que deseas eliminar
2. Haz clic en el botón **Eliminar**
3. Confirma la operación de eliminación

:::warning Nota
Después de eliminar una clave de API, todas las aplicaciones que utilicen esa clave ya no podrán acceder a la API.
:::

## Uso de Claves de API

### Ejemplo con cURL

```bash
curl -X GET "https://your-tianji-domain.com/open/global/config" \
  -H "Authorization: Bearer <tu_clave_api_aquí>" \
  -H "Content-Type: application/json"
```

### Ejemplo en JavaScript/Node.js

```javascript
const apiKey = '<tu_clave_api_aquí>';
const baseUrl = 'https://your-tianji-domain.com/open';

const headers = {
  'Authorization': `Bearer ${apiKey}`,
  'Content-Type': 'application/json'
};

// Usando fetch
const response = await fetch(`${baseUrl}/global/config`, {
  method: 'GET',
  headers: headers
});

// Usando axios
const axios = require('axios');
const response = await axios.get(`${baseUrl}/global/config`, {
  headers: headers
});
```

### Ejemplo en Python

```python
import requests

api_key = '<tu_clave_api_aquí>'
base_url = 'https://your-tianji-domain.com/open'

headers = {
    'Authorization': f'Bearer {api_key}',
    'Content-Type': 'application/json'
}

# Usando la biblioteca requests
response = requests.get(f'{base_url}/global/config', headers=headers)
data = response.json()
```

### Ejemplo en PHP

```php
<?php
$apiKey = '<tu_clave_api_aquí>';
$baseUrl = 'https://your-tianji-domain.com/open';

$headers = [
    'Authorization: Bearer ' . $apiKey,
    'Content-Type: application/json'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $baseUrl . '/global/config');
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

$data = json_decode($response, true);
?>
```

## Permisos y Alcance

### Permisos de Clave de API

Las claves de API heredan todos los permisos de su creador, incluyendo:
- Acceso a todos los datos en los espacios de trabajo del usuario
- Ejecutar todas las operaciones para las que el usuario tiene permiso
- Gestionar recursos creados por ese usuario

### Acceso a Espacios de Trabajo

Las claves de API solo pueden acceder a los espacios de trabajo a los que pertenece el usuario. Si necesitas acceder a múltiples espacios de trabajo, asegúrate de que tu cuenta de usuario tenga permisos adecuados para esos espacios.

## Manejo de Errores

### Errores Comunes de Autenticación

#### 401 No Autorizado

```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Authorization not provided"
  }
}
```

**Causas**:
- No se proporcionó un encabezado de autorización
- Formato incorrecto de clave de API

#### 403 Prohibido

```json
{
  "error": {
    "code": "FORBIDDEN", 
    "message": "Insufficient access"
  }
}
```

**Causas**:
- Clave de API inválida o eliminada
- El usuario no tiene permiso para acceder al recurso solicitado

### Depuración de Problemas de Autenticación

1. **Verificar formato de la clave de API**: Asegúrate de utilizar el formato `Bearer token_aquí`
2. **Verificar validez de la clave**: Confirma que la clave aún existe en la interfaz de Tianji
3. **Verificar permisos**: Asegúrate de que la cuenta de usuario tenga permiso para acceder al recurso objetivo
4. **Probar puntos finales simples**: Comienza probando puntos finales públicos como `/global/config`
