---
sidebar_position: 1
_i18n_hash: 3e7ad33b9d88240c2ee01504fb17ed2d
---
# Penggunaan dalam Docusaurus

Dalam `docusaurus.config.js`:

```js
/** @type {import('@docusaurus/types').Config} */
const config = {
  // ...

  scripts: [
    {
      src: 'https://<domain-anda>/tracker.js',
      async: true,
      defer: true,
      'data-website-id': '<website-id-anda>',
    },
  ],
};

module.exports = config;
```
