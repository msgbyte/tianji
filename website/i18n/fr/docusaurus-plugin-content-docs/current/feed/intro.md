---
sidebar_position: 0
_i18n_hash: 2279fcf53ed0422cb00d2f89e2a43ac7
---
# Vue d'ensemble du flux

Le flux est un flux d'événements léger pour votre espace de travail. Il aide les équipes à agréger des événements importants provenant de différents systèmes dans des canaux, à collaborer autour des incidents et à tenir les parties prenantes informées.

## Concepts

- Canal : Un flux logique pour collecter et organiser les événements. Chaque canal peut être connecté à une ou plusieurs cibles de notification et peut éventuellement nécessiter une signature webhook.
- Événement : Un enregistrement unique avec nom, contenu, tags, source, identité de l'expéditeur, importance et charge utile optionnelle. Les événements peuvent être archivés/désarchivés.
- État : Un type spécial d'événement continu qui peut être inséré ou mis à jour de manière répétée avec un eventId stable, et résolu lorsqu'il est terminé.
- Intégration : Adaptateurs webhook intégrés qui convertissent les charges utiles tierces (par exemple GitHub, Stripe, Sentry, Tencent Cloud Alarm) en événements de flux.
- Notification : Les canaux peuvent diffuser les événements aux notificateurs configurés ; la fréquence de livraison peut être réglée par les paramètres du canal.

## Cas d'utilisation typiques

- Flux d'incidents de produit et d'infrastructure sur plusieurs services
- Notifications de déploiement et de publication CI/CD
- Signaux de facturation et d'abonnement
- Alertes de sécurité, de surveillance et d'erreurs
