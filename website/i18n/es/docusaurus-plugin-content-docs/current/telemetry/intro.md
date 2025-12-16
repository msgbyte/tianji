---
sidebar_position: 1
_i18n_hash: c61b6c9968c295ffdfdc1a484f853504
---
# Introducción

## Antecedentes

Como creadores de contenido, a menudo publicamos nuestros artículos en diversas plataformas de terceros. Sin embargo, para aquellos de nosotros que nos tomamos en serio nuestro contenido, publicar es solo el comienzo. Necesitamos monitorear continuamente la lectura de nuestros artículos con el tiempo. Desafortunadamente, nuestras capacidades de recopilación de datos están limitadas a lo que cada plataforma ofrece, lo que depende en gran medida de las capacidades propias de la plataforma. Además, cuando distribuimos el mismo contenido en diferentes plataformas, los datos de lectores y visitas están completamente aislados.

Como desarrollador, creo muchas aplicaciones de software. Sin embargo, una vez que lanzo estas aplicaciones, a menudo pierdo el control sobre ellas. Por ejemplo, después de lanzar un programa de línea de comandos, no tengo forma de saber cómo interactúan los usuarios con él o incluso cuántos usuarios están utilizando mi aplicación. Del mismo modo, al desarrollar una aplicación de código abierto, en el pasado solo podía medir el interés a través de las estrellas de GitHub, dejándome en la oscuridad sobre el uso real.

Por lo tanto, necesitamos una solución simple que recopile información mínima, respetando la privacidad personal y otras restricciones. Esta solución es la telemetría.

## Telemetría

En el campo de la computación, la telemetría es una tecnología común que implica el reporte mínimo y anónimo de información para abordar las preocupaciones de privacidad, mientras aún se satisfacen las necesidades analíticas básicas de los creadores de contenido.

Por ejemplo, el marco Next.js de React recoge información utilizando telemetría: [Referencia de API: CLI de Next.js | Next.js (nextjs.org)](https://nextjs.org/docs/app/api-reference/next-cli#telemetry)

Alternativamente, al incrustar una imagen de píxel transparente de 1px en un artículo, es posible recopilar datos de visitantes en sitios web sobre los cuales no tenemos control. Los navegadores modernos y la mayoría de los sitios web bloquean la inserción de scripts personalizados debido a posibles riesgos de seguridad. Sin embargo, una imagen parece mucho más inofensiva en comparación. Casi todos los sitios web permiten la carga de imágenes de terceros, haciendo factible la telemetría.

## ¿Qué información podemos recopilar a través de una imagen?

Sorprendentemente, recibir una solicitud de imagen nos permite recopilar más información de lo que uno podría esperar.

Al analizar las solicitudes de red, podemos obtener la dirección IP del usuario, el momento de la visita, el referente y el tipo de dispositivo. Esto nos permite analizar patrones de tráfico, como los momentos de mayor lectura y tendencias, distribución demográfica y granularidad de tráfico en diferentes plataformas. Esta información es particularmente valiosa para actividades de marketing y promoción.

## ¿Cómo podemos implementar la telemetría?

La telemetría es una tecnología sencilla que esencialmente requiere un punto de conexión para recibir solicitudes de Internet. Debido a su simplicidad, hay pocas herramientas dedicadas a este propósito. Muchos pueden no considerar importante el análisis, o pueden verse disuadidos por las barreras iniciales. Sin embargo, la demanda de tal funcionalidad es clara.

Desarrollar una solución de telemetría es simple. Solo necesitas crear un proyecto, configurar una ruta, recopilar información del cuerpo de la solicitud y devolver una imagen en blanco.

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

Si prefieres no desarrollar tu propia solución, te recomiendo Tianji. Como un proyecto de código abierto que ofrece **Análisis de Sitios Web**, **Monitoreo de Tiempo de Actividad** y **Estado del Servidor**, Tianji ha introducido recientemente una función de telemetría para ayudar a los creadores de contenido a reportar telemetría, facilitando así la recopilación de datos. Lo más importante, ser de código abierto significa que tienes control sobre tus datos y puedes agregar tráfico de múltiples plataformas en un solo lugar, evitando la fragmentación de ver la misma información en diferentes ubicaciones.

GitHub: [https://github.com/msgbyte/tianji](https://github.com/msgbyte/tianji)

Sitio web oficial: [https://tianji.msgbyte.com/](https://tianji.msgbyte.com/)
