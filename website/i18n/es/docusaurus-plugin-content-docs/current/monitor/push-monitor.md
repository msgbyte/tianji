---
sidebar_position: 2
_i18n_hash: 0ab5a3f0d3e61495d00a9489e9a3f806
---
# Monitor de Envío

El Monitor de Envío es un método de monitoreo donde tu aplicación envía activamente señales de vida a **Tianji** en lugar de que Tianji verifique tu servicio. Esto es especialmente útil para monitorear tareas en segundo plano, trabajos cron o servicios detrás de firewalls que no pueden ser accedidos directamente.

## Cómo Funciona

1. **Tianji** te proporciona una URL de endpoint de envío única.
2. Tu aplicación envía solicitudes HTTP POST a este endpoint a intervalos regulares.
3. Si no se recibe una señal de vida dentro del periodo de tiempo configurado, Tianji genera una alerta.

## Configuración

Al crear un Monitor de Envío, necesitas configurar:

- **Nombre del Monitor**: Un nombre descriptivo para tu monitor.
- **Tiempo de Espera (Timeout)**: El tiempo máximo (en segundos) entre señales de vida antes de considerar el servicio inactivo.
- **Intervalo Recomendado**: La frecuencia con la que tu aplicación debería enviar señales de vida (normalmente el mismo que el tiempo de espera).

## Formato del Endpoint de Envío

```
POST https://tianji.example.com/api/push/{pushToken}
```

### Parámetros de Estado

- **Estado Normal**: Enviar sin parámetros o con `?status=up`
- **Estado Inactivo**: Enviar con `?status=down` para activar manualmente una alerta
- **Mensaje Personalizado**: Añadir `&msg=tu-mensaje` para incluir información adicional
- **Valor Personalizado**: Añadir `&value=123` para seguir valores numéricos

## Ejemplos

### Señal de Vida Básica (cURL)

```bash
# Enviar señal de vida cada 60 segundos
while true; do
  curl -X POST "https://tianji.example.com/api/push/<tu-push-token>"
  sleep 60
done
```

### JavaScript/Node.js

```javascript
// Enviar señal de vida cada 60 segundos
setInterval(async () => {
  try {
    await fetch('https://tianji.example.com/api/push/<tu-push-token>', { 
      method: 'POST' 
    });
    console.log('Señal de vida enviada exitosamente');
  } catch (error) {
    console.error('Error al enviar señal de vida:', error);
  }
}, 60000);
```

### Python

```python
import requests
import time

def enviar_senal_de_vida():
    try:
        response = requests.post('https://tianji.example.com/api/push/<tu-push-token>')
        print('Señal de vida enviada exitosamente')
    except Exception as e:
        print(f'Error al enviar señal de vida: {e}')

# Enviar señal de vida cada 60 segundos
while True:
    enviar_senal_de_vida()
    time.sleep(60)
```

## Casos de Uso

### 1. Trabajos Cron

Monitorea la ejecución de tareas programadas:

```bash
#!/bin/bash
# tu-trabajo-cron.sh

# Tu lógica de trabajo aquí
./ejecutar-respaldo.sh

# Enviar señal de éxito
if [ $? -eq 0 ]; then
  curl -X POST "https://tianji.example.com/api/push/<tu-push-token>?status=up&msg=backup-completed"
else
  curl -X POST "https://tianji.example.com/api/push/<tu-push-token>?status=down&msg=backup-failed"
fi
```

### 2. Servicios en Segundo Plano

Monitorea procesos de larga duración en segundo plano:

```python
import requests
import time
import threading

class MonitorDeServicio:
    def __init__(self, url_de_envio):
        self.url_de_envio = url_de_envio
        self.en_ejecucion = True
        
    def iniciar_senal_de_vida(self):
        def bucle_de_senal_de_vida():
            while self.en_ejecucion:
                try:
                    requests.post(self.url_de_envio)
                    time.sleep(30)  # Enviar cada 30 segundos
                except Exception as e:
                    print(f"Error en señal de vida: {e}")
        
        hilo = threading.Thread(target=bucle_de_senal_de_vida)
        hilo.daemon = True
        hilo.start()

# Uso
monitor = MonitorDeServicio('https://tianji.example.com/api/push/<tu-push-token>')
monitor.iniciar_senal_de_vida()

# Tu lógica principal del servicio aquí
while True:
    # Realiza tu trabajo
    time.sleep(1)
```

### 3. Trabajos de Sincronización de Base de Datos

Monitorea tareas de sincronización de datos:

```python
import requests
import schedule
import time

def sincronizar_datos():
    try:
        # Tu lógica de sincronización de datos aquí
        resultado = realizar_sincronizacion_datos()
        
        if resultado.exito:
            requests.post(
                'https://tianji.example.com/api/push/<tu-push-token>',
                params={'status': 'up', 'msg': f'sincronizados-{resultado.registros}-registros'}
            )
        else:
            requests.post(
                'https://tianji.example.com/api/push/<tu-push-token>',
                params={'status': 'down', 'msg': 'sincronizacion-fallida'}
            )
    except Exception as e:
        requests.post(
            'https://tianji.example.com/api/push/<tu-push-token>',
            params={'status': 'down', 'msg': f'error-{str(e)}'}
        )

# Programar para ejecutar cada hora
schedule.every().hour.do(sincronizar_datos)

while True:
    schedule.run_pending()
    time.sleep(1)
```

## Mejores Prácticas

1. **Configura Tiempos de Espera Apropiados**: Configura valores de tiempo de espera según las necesidades de tu aplicación. Para tareas frecuentes, usa tiempos de espera más cortos. Para tareas periódicas, usa tiempos de espera más largos.

2. **Maneja Fallos de Red**: Implementa lógica de reintento en tu código de señal de vida para manejar problemas de red temporales.

3. **Usa Mensajes Significativos**: Incluye mensajes descriptivos con tus señales de vida para proporcionar contexto al revisar los registros.

4. **Monitorea Rutas Críticas**: Realiza llamadas de señal de vida en puntos críticos de tu flujo de aplicación, no solo al inicio.

5. **Manejo de Excepciones**: Envía un estado "inactivo" cuando ocurre una excepción en tu aplicación.

## Solución de Problemas

### Problemas Comunes

**No se reciben señales de vida**:
- Verifica que el token de envío es correcto.
- Revisa la conectividad de red desde tu aplicación hasta Tianji.
- Asegúrate de que tu aplicación está ejecutando el código de señal de vida.

**Alarmas frecuentes falsas**:
- Aumenta el valor del tiempo de espera.
- Revisa si tu aplicación está experimentando problemas de rendimiento.
- Revisa la estabilidad de la red entre tu aplicación y Tianji.

**Señales de vida perdidas**:
- Añade manejo de errores y registros a tu código de señal de vida.
- Considera implementar lógica de reintento para solicitudes fallidas.
- Monitorea el uso de recursos de tu aplicación.

## Consideraciones de Seguridad

- Mantén tus tokens de envío seguros y no los expongas en repositorios públicos.
- Usa endpoints HTTPS para cifrar datos en tránsito.
- Considera rotar tokens de envío periódicamente.
- Limita la frecuencia de señales de vida para evitar sobrecargar tu instancia de Tianji.

El monitoreo de envío ofrece una manera confiable de monitorear servicios que el monitoreo tradicional basado en ping no puede alcanzar, convirtiéndolo en una herramienta esencial para el monitoreo integral de infraestructura.
