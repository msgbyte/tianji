---
sidebar_position: 1
_i18n_hash: bd680ba831a70a5f00ce7db124d136dc
---
# Installation ohne Docker

Die Installation von `Tianji` mit Docker ist der beste Weg, da Sie sich nicht um Umweltprobleme kümmern müssen.

Falls Ihr Server jedoch keine Docker-Unterstützung bietet, können Sie es manuell installieren.

## Anforderungen

Sie benötigen:

- [Node.js](https://nodejs.org/en/download/) 18.12+ / 20.4+
- [pnpm](https://pnpm.io/) 9.x (9.7.1 wird empfohlen)
- [Git](https://git-scm.com/downloads)
- [Postgresql](https://www.postgresql.org/)
- [pm2](https://pm2.keymetrics.io/) - Um Tianji im Hintergrund auszuführen
- [apprise](https://github.com/caronc/apprise) - optional, falls Sie Benachrichtigungen benötigen

## Code klonen und bauen

```bash
git clone https://github.com/msgbyte/tianji.git
cd tianji
pnpm install

pnpm build
```

## Umgebungsdatei vorbereiten

Erstellen Sie eine `.env` Datei im Verzeichnis `src/server`

```ini
DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/tianji?schema=public"
JWT_SECRET="ersetzen-sie-mich-durch-einen-zufälligen-string"
```

Stellen Sie sicher, dass Ihre Datenbank-URL korrekt ist und denken Sie daran, die Datenbank zuvor zu erstellen.

Weitere Umgebungen finden Sie in diesem Dokument [environment](./environment.md).

> Wenn möglich, stellen Sie sicher, dass Ihre Zeichencodierung auf en_US.utf8 eingestellt ist, zum Beispiel: `createdb -E UTF8 -l en_US.utf8 tianji`

## Server ausführen

```bash
npm install pm2 -g && pm2 install pm2-logrotate

# Datenbankmigration initialisieren
cd src/server
pnpm db:migrate:apply

# Server starten
pm2 start ./dist/src/server/main.js --name tianji
```

Standardmäßig wird `Tianji` unter `http://localhost:12345` ausgeführt.

## Code auf neue Version aktualisieren

```bash
# Neue Versions-/Tags übernehmen
cd tianji
git fetch --tags
git checkout -q <version>

# Abhängigkeiten aktualisieren
pnpm install

# Projekt bauen
pnpm build

# Datenbankmigrationen durchführen
cd src/server
pnpm db:migrate:apply

# Server neu starten
pm2 restart tianji
```

# Häufig gestellte Fragen

## Installation von `isolated-vm` fehlgeschlagen

Wenn Sie Python 3.12 verwenden, wird möglicherweise folgender Fehler angezeigt:

```
ModuleNotFoundError: No module named 'distutils'
```

Dies liegt daran, dass Python 3.12 `distutils` als integriertes Modul entfernt hat. Es gibt jedoch eine gute Lösung dafür.

Sie können Ihre Python-Version von 3.12 auf 3.9 ändern, um das Problem zu beheben.

### Wie man es mit Brew-verwaltetem Python löst

```bash
brew install python@3.9
rm /opt/homebrew/bin/python3
ln -sf /opt/homebrew/bin/python3 /opt/homebrew/bin/python3.9
```

Anschließend können Sie die Version mit `python3 --version` überprüfen.
