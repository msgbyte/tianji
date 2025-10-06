---
sidebar_position: 1
_i18n_hash: 94d2e9b28e14ee0258d96bc450acf5f6
---
# Installation sans Docker

Utiliser Docker pour installer `Tianji` est la meilleure méthode car vous n'avez pas besoin de vous soucier des problèmes d'environnement.

Mais si votre serveur ne supporte pas Docker, vous pouvez essayer d'installer manuellement.

## Prérequis

Vous avez besoin de :

- [Node.js](https://nodejs.org/en/download/) 18.12+ / 20.4+
- [pnpm](https://pnpm.io/) 10.x (10.17.1 de préférence)
- [Git](https://git-scm.com/downloads)
- [PostgreSQL](https://www.postgresql.org/)
- [pm2](https://pm2.keymetrics.io/) - Pour exécuter Tianji en arrière-plan
- [apprise](https://github.com/caronc/apprise) - optionnel, si vous avez besoin de notifications

## Cloner le code et construire

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
JWT_SECRET="remplacez-moi-par-une-chaîne-aléatoire"
```

Assurez-vous que votre URL de base de données est correcte et n'oubliez pas de créer la base de données au préalable.

Pour plus d'informations sur l'environnement, vous pouvez consulter ce document [environment](./environment.md)

> Si possible, assurez-vous que votre encodage est en_US.utf8, par exemple : `createdb -E UTF8 -l en_US.utf8 tianji`

## Exécuter le serveur

```bash
npm install pm2 -g && pm2 install pm2-logrotate

# Init db migrate
cd src/server
pnpm db:migrate:apply

# Démarrer le serveur
pm2 start ./dist/src/server/main.js --name tianji
```

Par défaut, `Tianji` s'exécute sur `http://localhost:12345`.

## Mettre à jour le code vers une nouvelle version

```bash
# Vérifiez la nouvelle release/tag
cd tianji
git fetch --tags
git checkout -q <version>

# Mettre à jour les dépendances
pnpm install

# Construire le projet
pnpm build

# Exécuter les migrations de la base de données
cd src/server
pnpm db:migrate:apply

# Redémarrer le serveur
pm2 restart tianji
```

# Questions Fréquemment Posées

## L'installation de `isolated-vm` a échoué

Si vous utilisez Python 3.12, une erreur comme celle-ci peut être rapportée :

```
ModuleNotFoundError: No module named 'distutils'
```

C'est parce que Python 3.12 a supprimé `distutils` du module intégré. Nous avons une bonne solution pour cela.

Vous pouvez changer votre version de Python de 3.12 à 3.9 pour résoudre le problème.

### Comment le résoudre avec une version de Python contrôlée par Brew

```bash
brew install python@3.9
rm /opt/homebrew/bin/python3
ln -sf /opt/homebrew/bin/python3 /opt/homebrew/bin/python3.9
```

Ensuite, vous pouvez vérifier la version avec `python3 --version`.
