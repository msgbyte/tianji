---
sidebar_position: 1
_i18n_hash: 479219b036abf3d6006999bf96fd2ea9
---
# Rapporteur de Statut de Serveur

Vous pouvez signaler facilement le statut de votre serveur avec le rapporteur tianji.

Vous pouvez le télécharger depuis [https://github.com/msgbyte/tianji/releases](https://github.com/msgbyte/tianji/releases).

## Utilisation

```
Utilisation de tianji-reporter:
  --interval int
        Entrez l'INTERVALLE, en secondes (défaut 5)
  --mode http
        Le mode d'envoi des données de rapport, vous pouvez sélectionner: `http` ou `udp`, par défaut c'est `http` (défaut "http")
  --name string
        Le nom d'identification pour cette machine
  --url string
        L'URL http de tianji, par exemple : https://tianji.dev
  --vnstat
        Utilisez vnstat pour les statistiques de trafic, linux uniquement
  --workspace string
        L'identifiant de l'espace de travail pour tianji, cela devrait être un uuid
```

Les **url** et **workspace** sont requis, ce qui signifie que vous indiquerez à quel hôte et dans quel espace de travail vous allez signaler votre service.

Par défaut, le nom d'un nœud de serveur sera le même que le nom d'hôte, donc vous pouvez personnaliser votre nom avec `--name` pour vous aider à identifier le serveur.

## Script d'installation automatique

Vous pouvez obtenir votre script d'installation automatique dans `Tianji` -> `Servers` -> `Add` -> onglet `Auto`.

Il téléchargera automatiquement le rapporteur et créera un service linux sur votre machine, donc cela nécessite des permissions root.

### Désinstallation

Si vous souhaitez désinstaller le service de rapporteur, vous pouvez utiliser cette commande comme suit :
```bash
curl -o- https://tianji.example.com/serverStatus/xxxxxxxxxxxxxxxxxxx/install.sh?url=https://tianji.example.com | sudo bash -s uninstall
```

Le principal changement est d'ajouter `-s uninstall` à votre commande d'installation.

## Kubernetes

Si vos serveurs fonctionnent dans un cluster Kubernetes, vous pouvez déployer le rapporteur en tant que DaemonSet pour que chaque nœud signale automatiquement les métriques. Voir [Déployer le Rapporteur comme DaemonSet](./kubernetes/reporter-daemonset.md) pour plus de détails.

## Q&R

### Comment vérifier le journal du service tianji reporter ?

Si vous avez installé avec le script d'installation automatique, tianji vous aidera à installer un service nommé `tianji-reporter` sur votre machine Linux.

Vous pouvez utiliser cette commande pour vérifier le journal du rapporteur tianji :

```bash
journalctl -fu tianji-reporter.service
```

### Machine non trouvée dans l'onglet serveur même si le rapport montre du succès

Peut-être que votre tianji est derrière un proxy inverse, par exemple `nginx`.

Veuillez vous assurer que votre proxy inverse ajoute la prise en charge des websockets.

## Pourquoi ma machine est-elle toujours hors ligne ?

Veuillez vérifier la date et l'heure de votre serveur.
