---
sidebar_position: 1
_i18n_hash: dbe4f3d388e41faf5b22d03df590fec6
---
# Utilisation dans Docusaurus

Dans `docusaurus.config.js` :

```js
/** @type {import('@docusaurus/types').Config} */
const config = {
  // ...

  scripts: [
    {
      src: 'https://<votre domaine>/tracker.js',
      async: true,
      defer: true,
      'data-website-id': '<votre-id-de-site-web>',
    },
  ],
};

module.exports = config;
```
