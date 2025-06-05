---
sidebar_position: 100
_i18n_hash: 05e241c8bd878bb8fb511bdc81a2cee9
---
# Dépannage

Ce document répertorie les problèmes courants et leurs solutions que vous pouvez rencontrer lors de l'utilisation de Tianji.

## Problèmes de connexion WebSocket

### Description du problème

Lorsque vous utilisez des services HTTPS, les autres fonctions fonctionnent normalement, mais le service WebSocket ne peut pas se connecter correctement, ce qui se manifeste par :

- L'indicateur d'état de connexion en bas à gauche qui affiche gris
- La liste des pages serveur montre des comptes mais aucun contenu réel

### Cause principale

Ce problème est généralement causé par des politiques de transfert WebSocket inappropriées dans le logiciel de proxy inverse. Dans les environnements HTTPS, les connexions WebSocket nécessitent des politiques de sécurité des cookies correctes.

### Solution

Vous pouvez résoudre ce problème en définissant la variable d'environnement suivante :

```bash
AUTH_USE_SECURE_COOKIES=true
```

Ce paramètre force l'application à traiter les cookies passés par le navigateur comme des cookies cryptés, résolvant ainsi les problèmes de connexion WebSocket.

#### Méthodes de configuration

**Environnement Docker :**
```yaml
# docker-compose.yml
services:
  tianji:
    environment:
      - AUTH_USE_SECURE_COOKIES=true
```

**Déploiement direct :**
```bash
export AUTH_USE_SECURE_COOKIES=true
```

**Service systemd :**
```ini
[Service]
Environment=AUTH_USE_SECURE_COOKIES=true
```

### Étapes de vérification

Après la configuration, redémarrez le service et vérifiez :

1. L'indicateur d'état de connexion en bas à gauche doit être vert
2. Les pages serveur doivent afficher les données en temps réel normalement
3. Les connexions WebSocket doivent être correctement établies dans les outils de développement du navigateur

---

*Si vous rencontrez d'autres problèmes, n'hésitez pas à soumettre un [Issue](https://github.com/msgbyte/tianji/issues) ou à contribuer avec des solutions à cette documentation.*
