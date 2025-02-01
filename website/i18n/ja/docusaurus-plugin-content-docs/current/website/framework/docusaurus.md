---
sidebar_position: 1
_i18n_hash: dbe4f3d388e41faf5b22d03df590fec6
---
# Docusaurusでの使用

`docusaurus.config.js`内で：

```js
/** @type {import('@docusaurus/types').Config} */
const config = {
  // ...

  scripts: [
    {
      src: 'https://<your domain>/tracker.js',
      async: true,
      defer: true,
      'data-website-id': '<your-website-id>',
    },
  ],
};

module.exports = config;
```
