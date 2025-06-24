---
sidebar_position: 1
_i18n_hash: 1de8a86599061f446dd0699137a4e68c
---
# Rapport de statut du serveur

Vous pouvez facilement rapporter le statut de votre serveur avec le rapporteur Tianji.

Vous pouvez le télécharger depuis [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases)

## Utilisation

```
Utilisation du rapporteur tianji :
  --interval int
        Indiquez l'INTERVALLE, en secondes (par défaut 5)
  --mode http
        Le mode d'envoi des données de rapport, vous pouvez choisir : `http` ou `udp`, par défaut c'est `http` (par défaut "http")
  --name string
        Le nom d'identification pour cette machine
  --url string
        L'URL http de Tianji, par exemple : https://tianji.msgbyte.com
  --vnstat
        Utiliser vnstat pour les statistiques de trafic, uniquement sur Linux
  --workspace string
        L'identifiant de l'espace de travail pour Tianji, cela doit être un uuid
```

L'**url** et l'**espace de travail** sont requis, ce qui signifie que vous rapporterez votre service à quel hôte et quel espace de travail.

Par défaut, un nom de nœud serveur sera le même que le nom d'hôte, donc vous pouvez personnaliser votre nom avec `--name`, ce qui peut vous aider à identifier le serveur.

## Script d'installation automatique

Vous pouvez obtenir votre script d'installation automatique dans `Tianji` -> `Serveurs` -> `Ajouter` -> `Onglet Auto`.

Il téléchargera automatiquement le rapporteur et créera un service Linux sur votre machine. Cela nécessite donc des permissions root.

### Désinstallation

Si vous souhaitez désinstaller le service de rapporteur, vous pouvez utiliser cette commande :
```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
```

Le changement principal consiste à ajouter `-s uninstall` à votre commande d'installation.

## Q&R

### Comment vérifier le journal du service de rapporteur Tianji ?

Si vous avez installé avec le script d'installation automatique, Tianji vous aidera à installer un service nommé `tianji-reporter` sur votre machine Linux.

Vous pouvez utiliser cette commande pour vérifier le journal du rapporteur Tianji :

```bash
journalctl -fu tianji-reporter.service
```

### Vous ne trouvez pas votre machine dans l'onglet serveur même si le rapport montre un succès

Peut-être que votre Tianji est derrière un proxy inverse, par exemple `nginx`.

Veuillez vous assurer que votre proxy inverse ajoute le support WebSocket.

## Pourquoi ma machine est-elle toujours hors ligne ?

Veuillez vérifier la date et l'heure de votre serveur.
