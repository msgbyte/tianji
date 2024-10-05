---
sidebar_position: 1
_i18n_hash: c24c34a1a9df2ee5bd25253195dcba08
---
# Intégration avec Sentry

:::info
En savoir plus sur Sentry sur [sentry.io](https://sentry.io/)
:::

Cliquez sur `Paramètres` => `Intégrations` => `Créer une nouvelle intégration`

![](/img/docs/sentry/sentry1.png)

Créez une application `Intégration interne`

![](/img/docs/sentry/sentry2.png)

Entrez le nom `Tianji` et insérez l'URL du webhook dans le formulaire.

![](/img/docs/sentry/sentry3.png)

N'oubliez pas d'activer `Action de règle d'alerte`

![](/img/docs/sentry/sentry4.png)

Ensuite, ajoutez la `permission` de lecture des problèmes, et ajoutez `problème` et `erreur` au webhook

![](/img/docs/sentry/sentry5.png)

Enfin, vous pouvez créer une règle d'alerte, et vous verrez `Tianji` dans la liste déroulante des notifications

![](/img/docs/sentry/sentry6.png)
