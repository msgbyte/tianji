---
sidebar_position: 1
_i18n_hash: d9dd1597f6c275ebc68c7421c31b29fe
---
# Rapporteur de Statut du Serveur

Vous pouvez facilement rapporter le statut de votre serveur avec le rapporteur tianji.

Vous pouvez le télécharger depuis [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases)

## Utilisation

```
Utilisation de tianji-reporter:
  --interval int
        Saisissez l'INTERVALLE, en secondes (par défaut 5)
  --mode http
        Le mode d'envoi des données de rapport, vous pouvez sélectionner : `http` ou `udp`, par défaut est `http` (par défaut "http")
  --name string
        Le nom d'identification pour cette machine
  --url string
        L'URL http de tianji, par exemple : https://tianji.msgbyte.com
  --vnstat
        Utiliser vnstat pour les statistiques de trafic, uniquement sous linux
  --workspace string
        L'ID de l'espace de travail pour tianji, cela doit être un uuid
```

Les **url** et **workspace** sont obligatoires, cela signifie que vous allez rapporter votre service à quel hôte et quel espace de travail.

Par défaut, un nom de nœud de serveur sera identique au nom d'hôte, vous pouvez donc personnaliser votre nom avec `--name` pour vous aider à identifier le serveur.

## Script d'installation automatique

Vous pouvez obtenir votre script d'installation automatique dans `Tianji` -> `Servers` -> `Add` -> onglet `Auto`

il téléchargera automatiquement le rapporteur et créera un service linux sur votre machine. donc il nécessite des permissions root.

### Désinstallation

si vous souhaitez désinstaller le service de rapport, vous pouvez utiliser cette commande comme :
```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
``` 

La principale modification est d'ajouter `-s uninstall` à votre commande d'installation.

## FAQ

### Comment vérifier le journal de service du rapporteur tianji ?

Si vous installez avec le script d'installation automatique, tianji vous aidera à installer un service nommé `tianji-reporter` sur votre machine linux.

Vous pouvez utiliser cette commande pour vérifier le journal du rapporteur tianji :

```bash
journalctl -fu tianji-reporter.service
```

### Pas trouvé votre machine dans l'onglet serveur même si le rapport montre un succès

Peut-être que votre tianji est derrière un proxy inverse par exemple `nginx`.

Veuillez vous assurer que votre proxy inverse ajoute la prise en charge du websocket.

## Pourquoi ma machine est-elle toujours hors ligne ?

Veuillez vérifier la date et l'heure de votre serveur.
