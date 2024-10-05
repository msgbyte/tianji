---
sidebar_position: 2
_i18n_hash: c65e22ae3d729a07b0b23f525a89b8ca
---
# Environnement

Voici l'environnement que vous pouvez configurer dans Docker

| Nom | Valeur par défaut | Description |
| ---- | ---- | ----- |
| JWT_SECRET | - | Une chaîne aléatoire utilisée pour calculer la clé secrète |
| ALLOW_REGISTER | false | Indique si les utilisateurs peuvent s'inscrire |
| ALLOW_OPENAPI | false | Indique si l'API ouverte est autorisée à récupérer ou à poster des données comme vous avec l'interface utilisateur |
| SANDBOX_MEMORY_LIMIT | 16 | Limite de mémoire du bac à sable pour le script de surveillance personnalisé, permet de contrôler que le script de surveillance n'utilise pas trop de mémoire (unité MB, la valeur minimale est 8) |
| MAPBOX_TOKEN | - | Token MapBox pour utiliser AMap à la place de la carte des visiteurs par défaut |
| AMAP_TOKEN | - | Token AMap pour utiliser AMap à la place de la carte des visiteurs par défaut |
| CUSTOM_TRACKER_SCRIPT_NAME | - | Modifie le nom du script `tracker.js` par défaut pour le blocage des publicités |
| DISABLE_ANONYMOUS_TELEMETRY | false | Désactive l'envoi de rapports de télémétrie à Tianji officiel, nous enverrons des rapports d'utilisation au site officiel de Tianji avec un minimum d'anonymat. |
| DISABLE_AUTO_CLEAR | false | Désactive la suppression automatique des données. |
