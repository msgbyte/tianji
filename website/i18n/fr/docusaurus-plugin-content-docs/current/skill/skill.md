---
sidebar_position: 1
_i18n_hash: 3bea21234680fc0342392f5d9887ba15
---
# Intégration avec la compétence Agent

## Introduction

La **compétence de requête de données Tianji** est un ensemble de compétences léger et indépendant des agents qui permet aux agents d'intelligence artificielle (Cursor, Claude Code, Codex, Copilot CLI, etc.) de consulter directement la plateforme Tianji via son OpenAPI en lecture seule.

Elle suit la spécification [agentskills.io](https://agentskills.io/specification) — un seul fichier `SKILL.md` avec des fichiers de référence. Pas de processus à long terme, pas de runtime supplémentaire.

:::tip Pour commencer
Consultez le [Guide d'installation](./installation.md) pour une configuration en un clic et manuelle.
:::

**Ce qu'elle couvre:** 69 endpoints GET dans 14 domaines de service :

- **Website** — statistiques de trafic, pages vues, répartition géographique, rapports Lighthouse
- **Monitor** — statut de disponibilité, données de vérification récentes, événements de surveillance
- **Survey** — réponses aux enquêtes, statistiques des résultats, catégories d'IA
- **Telemetry** — compteurs d'événements personnalisés, vues de page de télémétrie, métriques
- **Feed** — canaux, flux d'événements, états du flux
- **Application** — avis sur l'App Store, infos sur les apps, statistiques d'événements
- **Billing / AI Gateway / Worker / Page / Workspace / Global / AuditLog**

## Compétence vs Serveur MCP

Tianji propose deux manières de s'intégrer aux agents d'IA. Choisissez celle qui correspond à votre flux de travail :

| | Compétence Agent | [Serveur MCP](/docs/mcp) |
|--|--|--|
| **Forme** | Fichiers de documentation simple (`SKILL.md` + références) | Un processus Node.js à long terme |
| **Runtime** | Aucun — l'agent utilise `curl` ou des outils HTTP intégrés | `npx tianji-mcp-server` |
| **Couverture** | 69 endpoints GET (lecture seule, surface complète) | Un sous-ensemble d'outils sélectionnés (lecture + certaines écritures) |
| **Configuration** | Déposez les fichiers dans le répertoire de compétences de l'agent | Ajoutez la config MCP au fichier de configuration de l'agent |
| **Idéal pour** | Cursor / Claude Code / Codex / tout agent suivant la spécification agentskills.io | Agents avec un support MCP natif |

Vous pouvez utiliser les deux en même temps sans conflit.

## Exemples d'utilisation

Une fois installé, vous pouvez poser des questions en langage naturel à votre agent d'IA et il choisira le bon endpoint :

### Exemple 1 : Aperçu du trafic du site web

```
Utilisateur : Montrez-moi les pages vues de mon site principal au cours des 7 derniers jours.

Agent : [Appelle GET /open/workspace/{workspaceId}/website/all pour trouver le site]
       [Puis GET /open/workspace/{workspaceId}/website/{websiteId}/pageviews
        avec startAt/endAt couvrant 7 jours]
       Votre site principal a reçu 12 438 pages vues au cours des 7 derniers jours,
       avec un pic de 2 103 mardi. Source principale : google.com (43%).
```

### Exemple 2 : Vérification de la santé du moniteur

```
Utilisateur : Est-ce que l'un de mes moniteurs est actuellement en panne ?

Agent : [Appelle GET /open/workspace/{workspaceId}/monitor/all]
       [Puis GET /open/workspace/{workspaceId}/monitor/{monitorId}/status
        pour chaque moniteur]
       2 moniteurs sont actuellement en panne :
       - api.example.com (HTTP 503, dernier UP il y a 12 min)
       - db-replica (délai d'attente TCP, dernier UP il y a 1h)
       Les 8 autres moniteurs sont en bonne santé.
```

### Exemple 3 : Analyse des résultats d'enquête

```
Utilisateur : Résumez les réponses à l'enquête "Commentaires clients T4".

Agent : [Appelle GET /open/workspace/{workspaceId}/survey/all pour retrouver l'ID]
       [Puis GET /open/workspace/{workspaceId}/survey/{surveyId}/stats]
       [Puis GET /open/workspace/{workspaceId}/survey/{surveyId}/result/list
        avec un curseur de pagination]
       "Commentaires clients T4" a reçu 218 réponses. Satisfaction moyenne
       de 4,3/5. Thème principal : performance du tableau de bord (mentionné 47 fois).
       Fonctionnalité la plus demandée : mode sombre (31 mentions).
```

## Gestion des données sensibles

Certains endpoints peuvent renvoyer des secrets stockés sur la plateforme (par exemple `modelApiKey`, `customModelBaseUrl` dans les réponses AI Gateway) ou des informations personnelles identifiables (membres de l'espace de travail, journaux d'audit, facturation).

La compétence instruit les agents de :

- **Ne jamais afficher** les champs `apiKey`, `modelApiKey`, `secret`, `token`, `password`, ou `credential`.
- **Rédiger ou omettre** ces champs lors de la synthèse des réponses.
- Pour les membres de l'espace de travail / journaux d'audit, ne présenter que des métadonnées non sensibles (noms, rôles, horodatages) sauf si l'utilisateur demande explicitement tous les détails.

Le `openapi-readonly.json` inclus rédige aussi ces champs au niveau du schéma, de sorte que les agents ne peuvent pas s'appuyer accidentellement sur leur structure.

## Source

La source de la compétence se trouve dans le dépôt Tianji sous [`skills/tianji-data-query/`](https://github.com/msgbyte/tianji/tree/master/skills/tianji-data-query). Les pull requests sont les bienvenus.
