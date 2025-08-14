---
sidebar_position: 1
_i18n_hash: 21a5dc8265605536c8c328c551abdcc9
---
# Rapporteur de Statut du Serveur

Vous pouvez facilement rapporter le statut de votre serveur avec le rapporteur Tianji.

Vous pouvez le télécharger depuis [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases).

## Utilisation

```
Utilisation de tianji-reporter :
  --interval int
        Entrez l'INTERVALLE, en secondes (par défaut 5)
  --mode http
        Le mode d'envoi des données de rapport, vous pouvez choisir : `http` ou `udp`, par défaut est `http` (par défaut "http")
  --name string
        Le nom d'identification de cette machine
  --url string
        L'URL http de tianji, par exemple : https://tianji.msgbyte.com
  --vnstat
        Utiliser vnstat pour les statistiques de trafic, uniquement sous Linux
  --workspace string
        L'ID de l'espace de travail pour tianji, cela devrait être un uuid
```

L’**url** et l'**espace de travail** sont requis, ce qui signifie que vous rapporterez votre service à quel hôte et dans quel espace.

Par défaut, un nom de nœud serveur sera identique au nom d'hôte, vous pouvez donc personnaliser votre nom avec `--name` pour vous aider à identifier le serveur.

## Script d'installation automatique

Vous pouvez obtenir votre script d'installation automatique dans `Tianji` -> `Servers` -> `Add` -> onglet `Auto`

Cela téléchargera automatiquement le rapporteur et créera un service Linux sur votre machine, donc cela nécessite une autorisation root.

### Désinstallation

Si vous souhaitez désinstaller le service rapporteur, vous pouvez utiliser cette commande comme suit :
```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
``` 

Le principal changement est d'ajouter `-s uninstall` à votre commande d'installation.

## Kubernetes

Si vos serveurs fonctionnent dans un cluster Kubernetes, vous pouvez déployer le rapporteur en tant que DaemonSet pour que chaque nœud rapporte automatiquement les métriques. Voir [Déployer le rapporteur en tant que DaemonSet](./kubernetes/reporter-daemonset.md) pour plus de détails.

## Q&R

### Comment vérifier le journal du service tianji reporter ?

Si vous installez avec le script d'installation automatique, tianji vous aidera à installer un service nommé `tianji-reporter` sur votre machine Linux.

Vous pouvez utiliser cette commande pour vérifier le journal du rapporteur tianji :

```bash
journalctl -fu tianji-reporter.service
```

### Machine non trouvée dans l'onglet serveur même si le rapport affiche un succès

Peut-être que votre tianji est derrière un proxy inverse, par exemple `nginx`.

Veuillez vous assurer que votre proxy inverse ajoute le support websocket.

## Pourquoi ma machine est-elle toujours hors ligne ?

Veuillez vérifier la date et l'heure de votre serveur.
