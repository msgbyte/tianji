---
sidebar_position: 20
_i18n_hash: e85199043ed7e89d1e71ea95a75b08df
---
# Configuration de Surveillance des Conteneurs Docker

## Comportement de Surveillance par Défaut

Lors de l'installation de Tianji à l'aide de Docker ou Docker Compose, le système active automatiquement la fonctionnalité de surveillance intégrée du serveur. Par défaut :

- **Tianji surveille automatiquement** l'utilisation des ressources système de son propre conteneur
- Les données de surveillance comprennent : l'utilisation du CPU, l'utilisation de la mémoire, l'utilisation du disque, le trafic réseau, etc.
- Ces données sont automatiquement rapportées à l'espace de travail par défaut sans configuration supplémentaire
- Le conteneur apparaîtra sous le nom de `tianji-container` dans le tableau de bord de surveillance

## Surveillance de Tous les Services Docker sur la Machine Hôte

Si vous souhaitez que Tianji surveille tous les conteneurs et services Docker exécutés sur la machine hôte, et pas seulement Tianji lui-même, vous devez mapper le socket Docker dans le conteneur.

### Méthode de Configuration

Ajoutez la configuration des volumes suivante à la section `tianji` dans votre fichier `docker-compose.yml` :

```yaml
services:
  tianji:
    image: moonrailgun/tianji
    # ... autres configurations ...
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
    # ... autres configurations ...
```

### Exemple Complet de docker-compose.yml

```yaml
version: '3'
services:
  tianji:
    image: moonrailgun/tianji
    build:
      context: ./
      dockerfile: ./Dockerfile
    ports:
      - "12345:12345"
    environment:
      DATABASE_URL: postgresql://tianji:tianji@postgres:5432/tianji
      JWT_SECRET: replace-me-with-a-random-string
      ALLOW_REGISTER: "false"
      ALLOW_OPENAPI: "true"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock  # Ajoutez cette ligne
    depends_on:
      - postgres
    restart: always
  postgres:
    # ... configuration de postgres ...
```

### Utilisation de la Commande Docker Run

Si vous démarrez Tianji en utilisant la commande `docker run`, vous pouvez ajouter le paramètre suivant :

```bash
docker run -d \
  --name tianji \
  -p 12345:12345 \
  -v /var/run/docker.sock:/var/run/docker.sock \
  moonrailgun/tianji
```

## Effets Après Configuration

Après avoir ajouté le mapping du socket Docker, Tianji pourra :

- Surveiller tous les conteneurs Docker exécutés sur la machine hôte
- Obtenir des informations d'utilisation des ressources des conteneurs
- Afficher des informations sur l'état des conteneurs
- Fournir une vue de surveillance système plus complète
