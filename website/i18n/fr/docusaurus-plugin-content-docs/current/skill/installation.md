---
sidebar_position: 2
_i18n_hash: 4ad4885ffd9d3dee0d40df9443ddf820
---
## Installation

La compétence se compose de seulement trois fichiers. Tout agent IA moderne (Cursor, Claude Code, Codex, Copilot CLI...) sait déjà où se trouve son propre répertoire de compétences — donc l'installation peut être aussi simple que de coller une seule invite.

## Installation en un clic (via Agent IA)

Collez l'invite ci-dessous dans votre agent IA. Il téléchargera les fichiers dans le bon répertoire de compétences pour sa plateforme, puis vous demandera toute configuration manquante.

```
Veuillez installer la compétence de requête de données Tianji dans votre répertoire de compétences :

https://github.com/msgbyte/tianji/tree/master/skills/tianji-data-query

Après le téléchargement, vérifiez si ces variables d'environnement sont définies :
  - TIANJI_BASE_URL
  - TIANJI_API_KEY
  - TIANJI_WORKSPACE_ID

Si l'une d'elles est manquante, demandez-moi les valeurs.
```

Et voilà. L'agent choisit son propre répertoire de compétences, récupère les fichiers et vous invite à fournir les informations d'identification si nécessaire.

## Installation manuelle

Si vous préférez l'installer manuellement, choisissez le répertoire cible pour votre agent et exécutez :

```bash
DEST="$HOME/.cursor/skills/tianji-data-query"   # ou tout ce que votre agent utilise
mkdir -p "$DEST/references"

BASE="https://raw.githubusercontent.com/msgbyte/tianji/master/skills/tianji-data-query"
curl -fSL "$BASE/SKILL.md"                          -o "$DEST/SKILL.md"
curl -fSL "$BASE/references/api-endpoints.md"       -o "$DEST/references/api-endpoints.md"
curl -fSL "$BASE/references/openapi-readonly.json"  -o "$DEST/references/openapi-readonly.json"
```

### Répertoire des compétences par agent

| Agent           | Répertoire                                         |
|-----------------|----------------------------------------------------|
| Cursor (perso)  | `~/.cursor/skills/tianji-data-query/`              |
| Cursor (projet) | `<project-root>/.cursor/skills/tianji-data-query/` |
| Claude Code     | `~/.claude/skills/tianji-data-query/`              |
| Codex           | `~/.codex/skills/tianji-data-query/`               |
| Codex (alt)     | `~/.agents/skills/tianji-data-query/`              |

## Variables d'environnement requises

La compétence nécessite trois valeurs. Exportez-les dans votre fichier rc de shell, ou définissez-les dans la configuration de la compétence de votre agent :

```bash
# URL de base de l'instance Tianji
TIANJI_BASE_URL=https://tianji.example.com

# Clé API pour l'authentification
TIANJI_API_KEY=votre_clé_api_ici

# ID de l'espace de travail par défaut
TIANJI_WORKSPACE_ID=votre_id_espace_travail_ici
```

### Obtenir une clé API

1. Connectez-vous à votre instance Tianji et cliquez sur votre **image de profil** dans le coin supérieur droit.
2. Sélectionnez **Profil** dans le menu déroulant.
3. Trouvez la section **Clés API**.
4. Cliquez sur **Créer une nouvelle clé** et suivez les instructions.

## Prochaines étapes

Après l'installation, retournez à [Intégration avec la compétence Agent](./skill.md) pour voir des exemples d'utilisation, la comparaison avec le serveur MCP, et comment la compétence gère les données sensibles.
