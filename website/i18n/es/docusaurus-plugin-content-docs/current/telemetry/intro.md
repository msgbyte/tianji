---
sidebar_position: 1
_i18n_hash: 1eae5f5894f7cbf4de993993feab86a5
---
# Introducción

## Antecedentes

Como creadores de contenido, a menudo publicamos nuestros artículos en diversas plataformas externas. Sin embargo, para aquellos de nosotros que nos tomamos en serio nuestro contenido, la publicación es solo el comienzo. Necesitamos monitorear continuamente la lectura de nuestros artículos a lo largo del tiempo. Desafortunadamente, nuestras capacidades de recopilación de datos están limitadas a lo que cada plataforma ofrece, lo que depende en gran medida de las propias capacidades de la plataforma. Además, cuando distribuimos el mismo contenido en diferentes plataformas, los datos de lectura y visitas están completamente aislados.

Como desarrollador, creo muchas aplicaciones de software. Sin embargo, una vez que libero estas aplicaciones, a menudo pierdo el control sobre ellas. Por ejemplo, después de liberar un programa de línea de comandos, no tengo forma de saber cómo los usuarios están interactuando con él o incluso cuántos usuarios están utilizando mi aplicación. De manera similar, al desarrollar una aplicación de código abierto, en el pasado, solo podía medir el interés a través de las estrellas de GitHub, dejándome sin información sobre el uso real.

Por lo tanto, necesitamos una solución simple que recoja la información mínima, respetando la privacidad personal y otras restricciones. Esta solución es la telemetría.

## Telemetría

En el campo de la informática, la telemetría es una tecnología común que implica el reporte mínimo y anónimo de información para abordar las preocupaciones de privacidad mientras satisface las necesidades analíticas básicas de los creadores de contenido.

Por ejemplo, el marco Next.js de React recoge información utilizando telemetría: [Referencia de API: Next.js CLI | Next.js (nextjs.org)](https://nextjs.org/docs/app/api-reference/next-cli#telemetry)

Alternativamente, al incrustar una imagen en blanco y transparente de 1px de tamaño en un artículo, es posible recopilar datos de visitantes en sitios web sobre los cuales no tenemos control. Los navegadores modernos y la mayoría de los sitios web bloquean la inserción de scripts personalizados debido a los posibles riesgos de seguridad. Sin embargo, una imagen parece mucho más inofensiva en comparación. Casi todos los sitios web permiten la carga de imágenes de terceros, lo que hace posible la telemetría.

## ¿Qué Información Podemos Recoger a Través de una Imagen?

Sorprendentemente, recibir una única solicitud de imagen nos permite recopilar más información de la que uno podría esperar.

Al analizar solicitudes de red, podemos obtener la dirección IP del usuario, la hora de visita, el referente y el tipo de dispositivo. Esto nos permite analizar patrones de tráfico, como los tiempos y tendencias pico de lectura, la distribución demográfica y la granularidad del tráfico en diferentes plataformas. Esta información es particularmente valiosa para actividades de marketing y promoción.

![](/img/telemetry/1.png)

## ¿Cómo Podemos Implementar la Telemetría?

La telemetría es una tecnología sencilla que esencialmente requiere un endpoint para recibir solicitudes de internet. Debido a su simplicidad, hay pocas herramientas dedicadas para este propósito. Muchos pueden no considerar los análisis importantes, o pueden sentirse desalentados por las barreras iniciales. Sin embargo, la demanda de tal funcionalidad es clara.

Desarrollar una solución de telemetría es sencillo. Solo necesitas crear un proyecto, configurar una ruta, recopilar información del cuerpo de la solicitud y devolver una imagen en blanco.

Aquí tienes un ejemplo usando Node.js:

```jsx
router.get(
  '/telemetry.gif',
  async (req, res) => {
    const ip = req.ip;
    const referer = req.header['referer'];
    const userAgent = req.headers['user-agent'];
    
    // Almacénalo en tu base de datos
    
    const blankGifBuffer = Buffer.from(
      'R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7',
      'base64'
    );
    res.header('Content-Type', 'image/gif').send(blankGifBuffer);
  }
);
```

Si prefieres no desarrollar tu propia solución, te recomiendo Tianji. Como proyecto de código abierto que ofrece **Analítica Web**, **Monitoreo de Tiempo de Actividad** y **Estado del Servidor**, Tianji ha introducido recientemente una función de telemetría para ayudar a los creadores de contenido a reportar telemetría, facilitando así una mejor recopilación de datos. Lo más importante es que, al ser de código abierto, tienes control sobre tus datos y puedes agregar tráfico de múltiples plataformas en un solo lugar, evitando la fragmentación de visualizar la misma información en diferentes ubicaciones.

![](/img/telemetry/2.png)

GitHub: [https://github.com/msgbyte/tianji](https://github.com/msgbyte/tianji)

Sitio Web Oficial: [https://tianji.dev/](https://tianji.dev/)
