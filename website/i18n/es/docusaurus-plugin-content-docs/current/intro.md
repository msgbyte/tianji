---
sidebar_position: 1
_i18n_hash: 252240b2a37c8c4784462e75b56d5243
---
# Introducción

## ¿Qué es Tianji?

Una frase para resumir:

**Tianji** = **Análisis de Sitios Web** + **Monitor de Tiempo Activo** + **Estado del Servidor**

### ¿Por qué se llama Tianji?

Tianji (天机, pronunciación Tiān Jī) en chino significa **Oportunidad Celestial** o **Estrategia**.

Los caracteres 天 (Tiān) y 机 (Jī) pueden traducirse como "cielo" y "máquina" o "mecanismo" respectivamente. Cuando se combinan, pueden referirse a un plan estratégico u oportunista o una oportunidad que parece estar orquestada por un poder superior o una fuerza celestial.

## Motivación

Durante nuestras observaciones del sitio web, a menudo necesitamos usar múltiples aplicaciones juntas. Por ejemplo, necesitamos herramientas de análisis como `GA`/`umami` para verificar pv/uv y el número de visitas a cada página, necesitamos un monitor de tiempo activo para verificar la calidad y conectividad de la red del servidor, y necesitamos usar prometheus para obtener el estado reportado por el servidor para verificar la calidad del servidor. Además, si desarrollamos una aplicación que permita despliegue de código abierto, a menudo necesitamos un sistema de telemetría para ayudarnos a recopilar la información más sencilla sobre las situaciones de despliegue de otras personas.

Creo que estas herramientas deberían servir al mismo propósito, entonces ¿existe una aplicación que pueda integrar estas necesidades comunes de manera ligera? Después de todo, la mayoría de las veces no necesitamos funciones muy profesionales y profundas. Pero para lograr un monitoreo integral, necesito instalar tantos servicios.

Es bueno especializarse en una cosa, si somos expertos en habilidades relacionadas, necesitamos herramientas especializadas. Pero para la mayoría de los usuarios que solo tienen necesidades ligeras, una aplicación **Todo en uno** será más conveniente y fácil de usar.

## Instalación

Instalar Tianji con Docker es muy simple. Solo asegúrate de haber instalado docker y el plugin de docker-compose.

Luego, ejecuta estos comandos en cualquier sitio:

```bash
wget https://raw.githubusercontent.com/msgbyte/tianji/master/docker-compose.yml
docker compose up -d
```

> La cuenta predeterminada es **admin**/**admin**, por favor cambia la contraseña lo antes posible.

## Comunidad

Únete a nuestra próspera comunidad para conectarte con otros usuarios, compartir experiencias y mantenerte actualizado sobre las últimas características y desarrollos. Colabora, haz preguntas y contribuye al crecimiento de la comunidad Tianji.

- [GitHub](https://github.com/msgbyte/tianji)
- [Discord](https://discord.gg/8Vv47wAEej)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/tianji)
