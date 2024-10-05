---
sidebar_position: 1
_i18n_hash: 252240b2a37c8c4784462e75b56d5243
---
# Introduction

## Qu'est-ce que Tianji

Une phrase pour résumer :

**Tianji** = **Analyse du site Web** + **Surveillance de l'uptime** + **État du serveur**

### Pourquoi s'appelle-t-il Tianji ?

Tianji (天机, prononciation Tiān Jī) en chinois qui signifie **Opportunité céleste** ou **Stratégie**

Les caractères 天 (Tiān) et 机 (Jī) peuvent être traduits respectivement par "ciel" et "machine" ou "mécanisme". Lorsqu'ils sont combinés, cela peut faire référence à un plan stratégique ou opportuniste ou à une opportunité qui semble être orchestrée par une puissance supérieure ou une force céleste.

## Motivation

Lors de nos observations du site Web, nous avons souvent besoin d'utiliser plusieurs applications ensemble. Par exemple, nous avons besoin d'outils d'analyse comme `GA`/`umami` pour vérifier les pv/uv et le nombre de visites sur chaque page, nous avons besoin d'un moniteur d'uptime pour vérifier la qualité du réseau et la connectivité du serveur, et nous avons besoin d'utiliser prometheus pour obtenir l'état signalé par le serveur pour vérifier la qualité du serveur. De plus, si nous développons une application qui permet le déploiement open source, nous avons souvent besoin d'un système de télémétrie pour nous aider à collecter les informations les plus simples sur les situations de déploiement des autres.

Je pense que ces outils devraient servir le même objectif, alors existe-t-il une application qui peut intégrer ces besoins courants de manière légère ? Après tout, la plupart du temps, nous n'avons pas besoin de fonctions très professionnelles et approfondies. Mais pour réaliser une surveillance complète, je dois installer autant de services.

Il est bon de se spécialiser dans une chose, si nous sommes des experts en capacités connexes, nous avons besoin de tels outils spécialisés. Mais pour la plupart des utilisateurs qui n'ont que des besoins légers, une application **All-in-One** sera plus pratique et plus facile à utiliser.

## Installation

L'installation de Tianji avec Docker est très simple. Assurez-vous simplement d'avoir installé docker et le plugin docker-compose

puis, exécutez ces commandes n'importe où :

```bash
wget https://raw.githubusercontent.com/msgbyte/tianji/master/docker-compose.yml
docker compose up -d
```

> Le compte par défaut est **admin**/**admin**, veuillez changer le mot de passe dès que possible.

## Communauté

Rejoignez notre communauté florissante pour vous connecter avec d'autres utilisateurs, partager des expériences et rester informé des dernières fonctionnalités et développements. Collaborez, posez des questions et contribuez à la croissance de la communauté Tianji.

- [GitHub](https://github.com/msgbyte/tianji)
- [Discord](https://discord.gg/8Vv47wAEej)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/tianji)
