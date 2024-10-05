---
sidebar_position: 1
_i18n_hash: 3cd3648cd037fe21e115e135f0c9fa5b
---
# Installation ohne Docker

Die Verwendung von Docker zur Installation von `Tianji` ist der beste Weg, da Sie sich keine Gedanken über Umgebungsprobleme machen müssen.

Wenn Ihr Server jedoch keine Dockerisierung unterstützt, können Sie versuchen, die Installation manuell durchzuführen.

## Voraussetzungen

Sie benötigen:

- [Node.js](https://nodejs.org/en/download/) 18.12+ / 20.4+
- [pnpm](https://pnpm.io/) 9.x (9.7.1 besser)
- [Git](https://git-scm.com/downloads)
- [postgresql](https://www.postgresql.org/)
- [pm2](https://pm2.keymetrics.io/) - Zur Ausführung von Tianji im Hintergrund
- [apprise](https://github.com/caronc/apprise) - optional, falls Sie es für Benachrichtigungen benötigen

## Code klonen und bauen

```bash
git clone https://github.com/msgbyte/tianji.git
cd tianji
pnpm install

pnpm build
```

## Umgebungsdatei vorbereiten

Erstellen Sie eine `.env`-Datei in `src/server`

```ini
DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/tianji?schema=public"
JWT_SECRET="ersetzen-durch-einen-zufälligen-string"
```

Stellen Sie sicher, dass Ihre Datenbank-URL korrekt ist, und denken Sie daran, die Datenbank vorher zu erstellen.

Weitere Umgebungsvariablen finden Sie in diesem Dokument [environment](../environment.md)

> Wenn möglich, stellen Sie sicher, dass Ihre Kodierung en_US.utf8 ist, zum Beispiel: `createdb -E UTF8 -l en_US.utf8 tianji`

## Server starten

```bash
npm install pm2 -g && pm2 install pm2-logrotate

# Datenbankmigration initialisieren
cd src/server
pnpm db:migrate:apply

# Server starten
pm2 start ./dist/src/server/main.js --name tianji
```

Standardmäßig wird `Tianji` auf http://localhost:12345 ausgeführt.

## Code auf eine neue Version aktualisieren

```bash
# Neue Version/Tags auschecken
cd tianji
git fetch --tags
git checkout -q <version>

# Abhängigkeiten aktualisieren
pnpm install

# Projekt bauen
pnpm build

# Datenbankmigrationen ausführen
cd src/server
pnpm db:migrate:apply

# Server neu starten
pm2 restart tianji
```

# Häufig gestellte Fragen

## Installation von `isolated-vm` fehlgeschlagen

Wenn Sie Python 3.12 verwenden, wird möglicherweise ein Fehler wie dieser gemeldet:

```
ModuleNotFoundError: No module named 'distutils'
```

Dies liegt daran, dass Python 3.12 `distutils` aus dem integrierten Modul entfernt hat. Jetzt gibt es eine gute Lösung dafür.

Sie können das Problem beheben, indem Sie Ihre Python-Version von 3.12 auf 3.9 wechseln.

### Wie man es in mit brew verwaltetem Python behebt

```bash
brew install python@3.9
rm /opt/homebrew/bin/python3
ln -sf /opt/homebrew/bin/python3 /opt/homebrew/bin/python3.9
```

Danach können Sie die Version mit `python3 --version` überprüfen.
