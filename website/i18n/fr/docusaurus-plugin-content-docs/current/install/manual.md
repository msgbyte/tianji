---
sidebar_position: 1
_i18n_hash: bd680ba831a70a5f00ce7db124d136dc
---
# Installer sans Docker

Utiliser Docker pour installer `Tianji` est la meilleure façon, car vous n'avez pas à vous soucier des problèmes d'environnement.

Mais si votre serveur ne supporte pas la conteneurisation Docker, vous pouvez essayer de l'installer manuellement.

## Prérequis

Vous aurez besoin de :

- [Node.js](https://nodejs.org/en/download/) 18.12+ / 20.4+
- [pnpm](https://pnpm.io/) 9.x (de préférence 9.7.1)
- [Git](https://git-scm.com/downloads)
- [PostgreSQL](https://www.postgresql.org/)
- [pm2](https://pm2.keymetrics.io/) - Pour exécuter Tianji en arrière-plan
- [apprise](https://github.com/caronc/apprise) - optionnel, si vous en avez besoin pour notifier

## Copier le code et construire

```bash
git clone https://github.com/msgbyte/tianji.git
cd tianji
pnpm install

pnpm build
```

## Préparer le fichier d'environnement

Créez un fichier `.env` dans `src/server`

```ini
DATABASE_URL="postgresql://user:pass@127.0.0.1:5432/tianji?schema=public"
JWT_SECRET="replace-me-with-a-random-string"
```

Assurez-vous que votre URL de base de données est correcte et n'oubliez pas de créer la base de données préalablement.

Pour plus d'informations sur l'environnement, consultez ce document [environment](./environment.md)

> Si possible, assurez-vous que votre encodage est en_US.utf8, par exemple : `createdb -E UTF8 -l en_US.utf8 tianji`

## Exécuter le serveur

```bash
npm install pm2 -g && pm2 install pm2-logrotate

# Initialiser la migration de DB
cd src/server
pnpm db:migrate:apply

# Démarrer le serveur
pm2 start ./dist/src/server/main.js --name tianji
```

Par défaut, `Tianji` s'exécutera sur `http://localhost:12345`

## Mettre à jour le code vers une nouvelle version

```bash
# Basculer vers la nouvelle version/tags
cd tianji
git fetch --tags
git checkout -q <version>

# Mettre à jour les dépendances
pnpm install

# Construire le projet
pnpm build

# Exécuter les migrations de base de données
cd src/server
pnpm db:migrate:apply

# Redémarrer le serveur
pm2 restart tianji
```

# Questions Fréquemment Posées

## Échec de l'installation de `isolated-vm`

Si vous utilisez Python 3.12, il se peut qu'une erreur soit signalée comme suit :

```
ModuleNotFoundError: No module named 'distutils'
```

Cela est dû au fait que Python 3.12 a supprimé `distutils` du module intégré. Nous avons maintenant une bonne solution à ce problème.

Vous pouvez résoudre cela en changeant votre version de Python de 3.12 à 3.9.

### Comment le résoudre avec Python contrôlé par Brew

```bash
brew install python@3.9
rm /opt/homebrew/bin/python3
ln -sf /opt/homebrew/bin/python3 /opt/homebrew/bin/python3.9
```

Ensuite, vous pouvez vérifier la version avec `python3 --version`.
