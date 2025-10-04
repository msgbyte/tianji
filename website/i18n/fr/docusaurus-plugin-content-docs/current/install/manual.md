---
sidebar_position: 1
_i18n_hash: 7b72ca055d015393e7ca37eb45f7a74b
---
# Installation sans Docker

L'utilisation de Docker pour installer `Tianji` est la meilleure méthode, car vous n'avez pas à vous soucier des problèmes d'environnement.

Cependant, si votre serveur ne prend pas en charge Docker, vous pouvez essayer d'installer manuellement.

## Prérequis

Vous avez besoin de :

- [Node.js](https://nodejs.org/en/download/) 18.12+ / 20.4+
- [pnpm](https://pnpm.io/) 10.x (10.17.1 est préférable)
- [Git](https://git-scm.com/downloads)
- [postgresql](https://www.postgresql.org/)
- [pm2](https://pm2.keymetrics.io/) - Pour exécuter Tianji en arrière-plan
- [apprise](https://github.com/caronc/apprise) - optionnel, si vous en avez besoin pour notifier

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

Assurez-vous que votre URL de base de données est correcte. Et n'oubliez pas de créer la base de données avant.

Pour plus d'environnements, consultez ce document [environnement](./environment.md)

> Si possible, assurez-vous que votre encodage est en_US.utf8, par exemple : `createdb -E UTF8 -l en_US.utf8 tianji`

## Exécuter le serveur

```bash
npm install pm2 -g && pm2 install pm2-logrotate

# Initialiser la migration de la base de données
cd src/server
pnpm db:migrate:apply

# Démarrer le serveur
pm2 start ./dist/src/server/main.js --name tianji
```

Par défaut, `Tianji` fonctionnera sur `http://localhost:12345`

## Mettre à jour le code vers une nouvelle version

```bash
# Extraire les nouvelles versions/tags
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

# Questions fréquemment posées

## Échec de l'installation de `isolated-vm`

Si vous utilisez Python 3.12, vous obtiendrez une erreur comme celle-ci :

```
ModuleNotFoundError: No module named 'distutils'
```

Cela est dû au fait que Python 3.12 a supprimé `distutils` du module intégré. Maintenant, nous avons une bonne solution pour cela.

Vous pouvez résoudre ce problème en passant votre version de Python de 3.12 à 3.9.

### Comment le résoudre avec Python contrôlé par brew

```bash
brew install python@3.9
rm /opt/homebrew/bin/python3
ln -sf /opt/homebrew/bin/python3 /opt/homebrew/bin/python3.9
```

Ensuite, vous pouvez vérifier la version avec `python3 --version`
