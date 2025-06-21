---
sidebar_position: 1
_i18n_hash: bf0ff03e7619ebadc59e7451f16ddf69
---
# Intégration avec MCP

<a href="https://cursor.com/install-mcp?name=tianji&config=eyJ0eXBlIjoic3RkaW8iLCJjb21tYW5kIjoibnB4IC15IHRpYW5qaS1tY3Atc2VydmVyIiwiZW52Ijp7IlRJQU5KSV9CQVNFX1VSTCI6IiIsIlRJQU5KSV9BUElfS0VZIjoiIiwiVElBTkpJX1dPUktTUEFDRV9JRCI6IiJ9fQ%3D%3D"><em><img src="https://cursor.com/deeplink/mcp-install-light.svg" alt="Ajouter le serveur Tianji MCP à Cursor" height="32" /></em></a>

## Introduction

Le serveur Tianji MCP est un serveur basé sur le protocole Model Context Protocol (MCP) qui sert de passerelle entre les assistants AI et la plateforme Tianji. Il expose la fonctionnalité de sondage de la plateforme Tianji aux assistants AI via le protocole MCP. Ce serveur fournit les fonctionnalités principales suivantes :

- Interroger les résultats d’un sondage
- Obtenir des informations détaillées sur un sondage
- Obtenir tous les sondages dans un espace de travail
- Obtenir la liste des sites web

## Méthodes d'installation

### Installation via NPX

Vous pouvez utiliser le serveur Tianji MCP en ajoutant la configuration suivante au fichier de configuration de votre assistant AI :

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

Avant d'utiliser le serveur Tianji MCP, vous devez définir les variables d'environnement suivantes :

```bash
# URL de base de l'API de la plateforme Tianji
TIANJI_BASE_URL=https://tianji.example.com

# Clé API de la plateforme Tianji
TIANJI_API_KEY=votre_clé_api_ici

# ID de l'espace de travail de la plateforme Tianji
TIANJI_WORKSPACE_ID=votre_id_espace_de_travail_ici
```

### Obtention d'une clé API

Vous pouvez obtenir une clé API de la plateforme Tianji en suivant ces étapes :

1. Après vous être connecté à la plateforme Tianji, cliquez sur votre **photo de profil** dans le coin supérieur droit
2. Sélectionnez **Profil** dans le menu déroulant
3. Sur la page de profil, trouvez l'option **Clés API**
4. Cliquez sur créer une nouvelle clé et suivez les instructions pour compléter la création de la clé

## Instructions d'utilisation

Le serveur Tianji MCP fournit une série d'outils qui peuvent interagir avec les assistants AI via le protocole MCP. Voici des descriptions détaillées de chaque outil :

### Interroger les résultats d'un sondage

Utilisez l'outil `tianji_get_survey_results` pour interroger les données de résultat pour un sondage spécifique.

**Paramètres :**

- `workspaceId`: ID de l'espace de travail Tianji (par défaut à la valeur configurée dans les variables d'environnement)
- `surveyId`: ID du sondage
- `limit`: Limite sur le nombre d'enregistrements retournés (par défaut 20)
- `cursor`: Curseur de pagination (optionnel)
- `startAt`: Heure de début, format ISO, exemple : 2023-10-01T00:00:00Z
- `endAt`: Heure de fin, format ISO, exemple : 2023-10-31T23:59:59Z
- `filter`: Conditions de filtrage (optionnel)

### Obtenir des informations sur un sondage

Utilisez l'outil `tianji_get_survey_info` pour obtenir des informations de base sur un sondage spécifique.

**Paramètres :**

- `workspaceId`: ID de l'espace de travail Tianji (par défaut à la valeur configurée dans les variables d'environnement)
- `surveyId`: ID du sondage

### Obtenir la liste complète des sondages

Utilisez l'outil `tianji_get_all_survey_list` pour obtenir une liste de tous les sondages dans l'espace de travail.

**Paramètres :**

- `workspaceId`: ID de l'espace de travail Tianji (par défaut à la valeur configurée dans les variables d'environnement)

### Obtenir la liste des sites web

Utilisez l'outil `tianji_get_website_list` pour obtenir une liste des sites web dans l'espace de travail.

**Paramètres :**

- `workspaceId`: ID de l'espace de travail Tianji (par défaut à la valeur configurée dans les variables d'environnement)

## Exemples d'utilisation

Voici des exemples d'interactions en langage naturel entre les utilisateurs et les assistants AI intégrés avec le serveur Tianji MCP :

### Exemple 1 : Obtenir la liste complète des sondages

```
Utilisateur : Aidez-moi à voir toutes mes listes de questionnaires de sondage

Assistant AI : Je vais obtenir toutes vos listes de questionnaires de sondage.
[L'Assistant AI appelle tianji_get_all_survey_list via le protocole MCP pour obtenir les données]
D'après les données de votre espace de travail, vous avez actuellement les sondages suivants :
1. Enquête de satisfaction d'expérience utilisateur (créée le 2023-09-15)
2. Enquête de retour sur les fonctionnalités du produit (créée le 2023-10-01)
3. Évaluation de l'utilisabilité du site web (créée le 2023-10-20)
```

### Exemple 2 : Obtenir les détails d'un sondage spécifique

```
Utilisateur : Veuillez me dire les détails de l'"Enquête de satisfaction d'expérience utilisateur"

Assistant AI : Je vais chercher les détails de ce sondage pour vous.
[L'Assistant AI appelle tianji_get_survey_info via le protocole MCP pour obtenir les données]
Détails de l'"Enquête de satisfaction d'expérience utilisateur" :
- Heure de création : 2023-09-15
- Statut : Actif
- Nombre de questions : 10
- Réponses collectées : 128
- Réponse la plus récente : 2023-10-25
```

### Exemple 3 : Interroger les résultats d'un sondage

```
Utilisateur : Aidez-moi à analyser les résultats d'octobre de l'"Enquête de retour sur les fonctionnalités du produit"

Assistant AI : Je vais analyser les résultats d'octobre de l'"Enquête de retour sur les fonctionnalités du produit".
[L'Assistant AI appelle tianji_get_survey_results via le protocole MCP pour obtenir les données pour la période spécifique]
Analyse des résultats de l'"Enquête de retour sur les fonctionnalités du produit" d'octobre :
- Total des réponses : 42
- Fonctionnalité la plus populaire : Rapports automatisés (85% de retour positif)
- Fonctionnalité la plus à améliorer : Adaptation mobile (mentionnée par 62%)
- Note moyenne de satisfaction : 4.2/5
- Suggestions principales des utilisateurs : Ajouter la fonctionnalité d'exportation de données, optimiser la vitesse de chargement des pages
```
