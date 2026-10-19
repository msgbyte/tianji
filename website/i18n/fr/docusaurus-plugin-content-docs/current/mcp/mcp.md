---
sidebar_position: 1
_i18n_hash: 50d592e977b3f195d40bd2931b68269b
---
# Intégration avec MCP

<a href="https://cursor.com/install-mcp?name=tianji&config=eyJ0eXBlIjoic3RkaW8iLCJjb21tYW5kIjoibnB4IC15IHRpYW5qaS1tY3Atc2VydmVyIiwiZW52Ijp7IlRJQU5KSV9CQVNFX1VSTCI6IiIsIlRJQU5KSV9BUElfS0VZIjoiIiwiVElBTkpJX1dPUktTUEFDRV9JRCI6IiJ9fQ%3D%3D"><em><img src="https://cursor.com/deeplink/mcp-install-light.svg" alt="Ajouter le serveur MCP Tianji à Cursor" height="32" /></em></a>
<br />
[![Ajouter à Kiro](https://kiro.dev/images/add-to-kiro.svg)](https://kiro.dev/launch/mcp/add?name=tianji&config=%7B%22command%22%3A%22npx%22%2C%22args%22%3A%5B%22-y%22%2C%22tianji-mcp-server%22%5D%2C%22env%22%3A%7B%22TIANJI_BASE_URL%22%3A%22https%3A%2F%2Ftianji.example.com%22%2C%22TIANJI_API_KEY%22%3A%22%3Cyour-api-key%3E%22%2C%22TIANJI_WORKSPACE_ID%22%3A%22%3Cyour-workspace-id%3E%22%7D%7D)

## Introduction

Le serveur MCP Tianji est un serveur basé sur le protocole Model Context Protocol (MCP) servant de pont entre les assistants IA et la plateforme Tianji. Il expose les fonctionnalités de sondage de la plateforme Tianji aux assistants IA via le protocole MCP. Ce serveur fournit les fonctionnalités principales suivantes :

- Interroger les résultats des sondages
- Obtenir des informations détaillées sur les sondages
- Obtenir tous les sondages dans un espace de travail
- Obtenir la liste des sites web

## Méthodes d'installation

### Installation par NPX

Vous pouvez utiliser le serveur MCP Tianji en ajoutant la configuration suivante au fichier de configuration de votre assistant IA :

```json
{
  "mcpServers": {
    "tianji": {
      "type": "stdio",
      "command": "npx",
      "args": [
        "-y",
        "tianji-mcp-server"
      ],
      "env": {
        "TIANJI_BASE_URL": "https://tianji.example.com",
        "TIANJI_API_KEY": "<votre-clé-api>",
        "TIANJI_WORKSPACE_ID": "<votre-id-espace-de-travail>"
      }
    }
  }
}
```

### Configuration des variables d'environnement

Avant d'utiliser le serveur MCP Tianji, vous devez définir les variables d'environnement suivantes :

```bash
# URL de base de l'API de la plateforme Tianji
TIANJI_BASE_URL=https://tianji.example.com

# Clé API de la plateforme Tianji
TIANJI_API_KEY=your_api_key_here

# ID de l'espace de travail de la plateforme Tianji
TIANJI_WORKSPACE_ID=your_workspace_id_here
```

### Obtention d'une clé API

Vous pouvez obtenir une clé API de la plateforme Tianji en suivant ces étapes :

1. Après vous être connecté à la plateforme Tianji, cliquez sur votre **photo de profil** en haut à droite
2. Sélectionnez **Profil** dans le menu déroulant
3. Sur la page de profil, trouvez l'option **Clés API**
4. Cliquez sur créer une nouvelle clé et suivez les instructions pour terminer la création de la clé

## Instructions d'utilisation

Le serveur MCP Tianji fournit une série d'outils pouvant interagir avec les assistants IA via le protocole MCP. Ci-dessous figurent des descriptions détaillées de chaque outil :

### Interroger les résultats des sondages

Utilisez l'outil `tianji_get_survey_results` pour interroger les données de résultats d'un sondage spécifique.

**Paramètres :**

- `workspaceId` : ID de l'espace de travail Tianji (défaut à la valeur configurée dans les variables d'environnement)
- `surveyId` : ID du sondage
- `limit` : Limite du nombre d'enregistrements retournés (par défaut 20)
- `cursor` : Curseur de pagination (optionnel)
- `startAt` : Heure de début, format ISO, exemple : 2023-10-01T00:00:00Z
- `endAt` : Heure de fin, format ISO, exemple : 2023-10-31T23:59:59Z
- `filter` : Conditions de filtrage (optionnel)

### Obtenir des informations de sondage

Utilisez l'outil `tianji_get_survey_info` pour obtenir des informations de base sur un sondage spécifique.

**Paramètres :**

- `workspaceId` : ID de l'espace de travail Tianji (défaut à la valeur configurée dans les variables d'environnement)
- `surveyId` : ID du sondage

### Obtenir la liste de tous les sondages

Utilisez l'outil `tianji_get_all_survey_list` pour obtenir la liste de tous les sondages dans l'espace de travail.

**Paramètres :**

- `workspaceId` : ID de l'espace de travail Tianji (défaut à la valeur configurée dans les variables d'environnement)

### Obtenir la liste des sites web

Utilisez l'outil `tianji_get_website_list` pour obtenir la liste des sites web dans l'espace de travail.

**Paramètres :**

- `workspaceId` : ID de l'espace de travail Tianji (défaut à la valeur configurée dans les variables d'environnement)

## Exemples d'utilisation

Ci-dessous figurent des exemples d'interactions en langage naturel entre les utilisateurs et des assistants IA intégrés avec le serveur MCP Tianji :

### Exemple 1 : Obtenir la liste de tous les sondages

```
Utilisateur : Aide-moi à voir toutes mes listes de questionnaires d'enquête

Assistant IA : Je vais obtenir toutes vos listes de questionnaires d'enquête pour vous.
[L'assistant IA appelle tianji_get_all_survey_list via le protocole MCP pour obtenir les données]
Basé sur les données de votre espace de travail, vous avez actuellement les sondages suivants :
1. Enquête de satisfaction sur l'expérience utilisateur (créée le 2023-09-15)
2. Enquête de retour d'information sur les fonctionnalités du produit (créée le 2023-10-01)
3. Évaluation de l'utilisabilité du site web (créée le 2023-10-20)
```

### Exemple 2 : Obtenir les détails d'un sondage spécifique

```
Utilisateur : Veuillez me donner les détails de l'enquête "Enquête de satisfaction sur l'expérience utilisateur"

Assistant IA : Je vais rechercher les détails de cette enquête pour vous.
[L'assistant IA appelle tianji_get_survey_info via le protocole MCP pour obtenir les données]
Détails de l'enquête "Enquête de satisfaction sur l'expérience utilisateur" :
- Date de création : 2023-09-15
- Statut : Actif
- Nombre de questions : 10
- Réponses collectées : 128
- Réponse la plus récente : 2023-10-25
```

### Exemple 3 : Interroger les résultats d'un sondage

```
Utilisateur : Aide-moi à analyser les résultats d'octobre de l'enquête "Retour d'information sur les fonctionnalités du produit"

Assistant IA : Je vais analyser les résultats d'octobre de l'enquête "Retour d'information sur les fonctionnalités du produit".
[L'assistant IA appelle tianji_get_survey_results via le protocole MCP pour obtenir les données pour la plage de temps spécifique]
Analyse des résultats d'octobre de l'enquête "Retour d'information sur les fonctionnalités du produit" :
- Total des réponses : 42
- Fonctionnalité la plus populaire : Rapports automatisés (85% de retour positif)
- Fonctionnalité nécessitant le plus d'amélioration : Adaptation mobile (mentionnée par 62%)
- Note moyenne de satisfaction : 4,2/5
- Principales suggestions des utilisateurs : Ajouter une fonctionnalité d'exportation de données, optimiser la vitesse de chargement des pages
```
