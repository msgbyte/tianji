---
sidebar_position: 1
_i18n_hash: bd680ba831a70a5f00ce7db124d136dc
---
# Instalar sin Docker

Usar Docker para instalar `Tianji` es la mejor manera ya que no necesitas preocuparte por problemas de entorno.

Pero si tu servidor no soporta dockerización, puedes intentar instalarlo manualmente.

## Requisitos

Necesitas:

- [Node.js](https://nodejs.org/en/download/) 18.12+ / 20.4+
- [pnpm](https://pnpm.io/) 9.x (mejor 9.7.1)
- [Git](https://git-scm.com/downloads)
- [PostgreSQL](https://www.postgresql.org/)
- [pm2](https://pm2.keymetrics.io/) - para ejecutar Tianji en segundo plano
- [apprise](https://github.com/caronc/apprise) - opcional, si necesitas notificaciones

## Clonar Código y Construir

```bash
git clone https://github.com/msgbyte/tianji.git
cd tianji
pnpm install

pnpm build
```

## Preparar Archivo de Entorno

Crea un archivo `.env` en `src/server`

```ini
DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/tianji?schema=public"
JWT_SECRET="reemplázame-con-una-cadena-aleatoria"
```

Asegúrate de que la URL de tu base de datos sea correcta y no olvides crear la base de datos antes.

Para más configuraciones de entorno, puedes revisar este documento [environment](./environment.md)

> Si puedes, mejor asegurarte de que tu codificación sea en_US.utf8, por ejemplo: `createdb -E UTF8 -l en_US.utf8 tianji`

## Ejecutar Servidor

```bash
npm install pm2 -g && pm2 install pm2-logrotate

# Inicializar migración de base de datos
cd src/server
pnpm db:migrate:apply

# Iniciar Servidor
pm2 start ./dist/src/server/main.js --name tianji
```

Por defecto, `Tianji` correrá en `http://localhost:12345`

## Actualizar Código a una Nueva Versión

```bash
# Cambiar a nueva release/etiqueta
cd tianji
git fetch --tags
git checkout -q <version>

# Actualizar dependencias
pnpm install

# Construir proyecto
pnpm build

# Ejecutar migraciones de base de datos
cd src/server
pnpm db:migrate:apply

# Reiniciar Servidor
pm2 restart tianji
```

# Preguntas Frecuentes

## Error al instalar `isolated-vm`

Si estás usando Python 3.12, reportará un error como este:

```
ModuleNotFoundError: No module named 'distutils'
```

Esto se debe a que Python 3.12 eliminó `distutils` del módulo incorporado. Ahora tenemos una buena solución para esto.

Puedes cambiar tu versión de Python de 3.12 a 3.9 para resolverlo.

### Cómo resolverlo en Python controlado por Brew

```bash
brew install python@3.9
rm /opt/homebrew/bin/python3
ln -sf /opt/homebrew/bin/python3 /opt/homebrew/bin/python3.9
```

Luego puedes verificar la versión con `python3 --version`
