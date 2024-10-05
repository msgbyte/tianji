---
sidebar_position: 1
_i18n_hash: 848acc7fae249b1c435a363e4693a5c7
---
# Rapporteur d'état du serveur

vous pouvez facilement signaler l'état de votre serveur avec le rapporteur Tianji

vous pouvez télécharger depuis [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases)

## Utilisation

```
Usage de tianji-reporter:
  --interval int
        Entrez l'INTERVALLE, en secondes (par défaut 5)
  --mode http
        Le mode d'envoi des données de rapport, vous pouvez choisir : `http` ou `udp`, par défaut est `http` (par défaut "http")
  --name string
        Le nom d'identification pour cette machine
  --url string
        L'URL http de Tianji, par exemple : https://tianji.msgbyte.com
  --vnstat
        Utiliser vnstat pour les statistiques de trafic, uniquement pour Linux
  --workspace string
        L'ID de l'espace de travail pour Tianji, cela devrait être un UUID
```

Les **url** et **workspace** sont requis, cela signifie que vous allez signaler votre service à quel hôte et quel espace de travail.

Par défaut, le nom d'un nœud de serveur sera le même que le nom d'hôte, vous pouvez donc personnaliser votre nom avec `--name` qui peut vous aider à identifier le serveur.

## Script d'installation automatique

Vous pouvez obtenir votre script d'installation automatique dans `Tianji` -> `Serveurs` -> `Ajouter` -> `Auto` onglet

il téléchargera automatiquement le rapporteur et créera un service Linux sur votre machine. Il nécessite donc des permissions root.

### Désinstaller

si vous souhaitez désinstaller le service de rapporteur, vous pouvez utiliser cette commande comme :
```bash
curl -o- https://tianji.exmaple.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | bash -s uninstall
``` 

le changement principal consiste à ajouter `-s uninstall` après votre commande d'installation.

## Q&R

### Comment vérifier les journaux du service de rapporteur Tianji ?

Si vous avez installé avec le script d'installation automatique, Tianji vous aidera à installer un service nommé `tianji-reporter` sur votre machine Linux.

Vous pouvez utiliser cette commande pour vérifier les journaux du rapporteur Tianji :

```bash
journalctl -fu tianji-reporter.service
```

### Votre machine n'est pas trouvée dans l'onglet des serveurs même si le rapport indique succès

Peut-être que votre Tianji est derrière un proxy inverse, par exemple `nginx`.

Veuillez vous assurer que votre proxy inverse ajoute la prise en charge des websockets

## Pourquoi ma machine est toujours hors ligne ?

Veuillez vérifier l'heure de votre serveur.
