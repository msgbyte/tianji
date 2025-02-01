---
sidebar_position: 1
_i18n_hash: dbe4f3d388e41faf5b22d03df590fec6
---
# Verwendung in Docusaurus

In `docusaurus.config.js`:

```js
/** @type {import('@docusaurus/types').Config} */
const config = {
  // ...

  scripts: [
    {
      src: 'https://<deine-domain>/tracker.js',
      async: true,
      defer: true,
      'data-website-id': '<deine-website-id>',
    },
  ],
};

module.exports = config;
```
