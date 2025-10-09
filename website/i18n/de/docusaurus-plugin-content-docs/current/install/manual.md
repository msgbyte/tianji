---
sidebar_position: 1
_i18n_hash: 94d2e9b28e14ee0258d96bc450acf5f6
---
# Installation ohne Docker

Die Verwendung von Docker zur Installation von `Tianji` ist der beste Weg, da Sie sich keine Gedanken über Umgebungsprobleme machen müssen.

Wenn Ihr Server jedoch kein Docker unterstützt, können Sie versuchen, es manuell zu installieren.

## Anforderungen

Sie benötigen:

- [Node.js](https://nodejs.org/en/download/) 18.12+ / 20.4+
- [pnpm](https://pnpm.io/) 9.x (9.7.1 besser)
- [Git](https://git-scm.com/downloads)
- [PostgreSQL](https://www.postgresql.org/)
- [pm2](https://pm2.keymetrics.io/) - Um Tianji im Hintergrund auszuführen
- [Apprise](https://github.com/caronc/apprise) - optional, falls Sie Benachrichtigungen benötigen

## Code klonen und bauen

```bash
git clone https://github.com/msgbyte/tianji.git
cd tianji
pnpm install

pnpm build
```

## Umgebungsdatei vorbereiten

Erstellen Sie eine `.env` Datei in `src/server`

```ini
DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/tianji?schema=public"
JWT_SECRET="ersetzen-sie-mich-durch-einen-beliebigen-string"
```

Stellen Sie sicher, dass Ihre Datenbank-URL korrekt ist, und vergessen Sie nicht, die Datenbank vorher zu erstellen.

Weitere Umgebungen finden Sie in diesem Dokument [environment](./environment.md)

> Wenn Sie können, ist es besser sicherzustellen, dass Ihr Encoding en_US.utf8 ist, zum Beispiel: `createdb -E UTF8 -l en_US.utf8 tianji`

## Server ausführen

```bash
npm install pm2 -g && pm2 install pm2-logrotate

# DB-Migration initialisieren
cd src/server
pnpm db:migrate:apply

# Server starten
pm2 start ./dist/src/server/main.js --name tianji
```

Standardmäßig läuft `Tianji` auf `http://localhost:12345`.

## Code auf neue Version aktualisieren

```bash
# Neuen Release/Tags auschecken
cd tianji
git fetch --tags
git checkout -q <version>

# Abhängigkeiten aktualisieren
pnpm install

# Projekt bauen
pnpm build

# DB-Migrationen durchführen
cd src/server
pnpm db:migrate:apply

# Server neu starten
pm2 restart tianji
```

# Häufig gestellte Fragen

## Installation von `isolated-vm` fehlgeschlagen

Wenn Sie Python 3.12 verwenden, wird ein Fehler wie folgt angezeigt:

```
ModuleNotFoundError: No module named 'distutils'
```

Das liegt daran, dass Python 3.12 `distutils` aus dem eingebauten Modul entfernt hat. Jetzt haben wir eine gute Lösung dafür.

Sie können Ihre Python-Version von 3.12 auf 3.9 ändern, um das Problem zu lösen.

### Wie man es mit einem von Brew verwalteten Python löst

```bash
brew install python@3.9
rm /opt/homebrew/bin/python3
ln -sf /opt/homebrew/bin/python3 /opt/homebrew/bin/python3.9
```

Dann können Sie die Version mit `python3 --version` überprüfen.
