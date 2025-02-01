---
sidebar_position: 1
_i18n_hash: dbe4f3d388e41faf5b22d03df590fec6
---
# 在 Docusaurus 中使用

在 `docusaurus.config.js` 中：

```js
/** @type {import('@docusaurus/types').Config} */
const config = {
  // ...

  scripts: [
    {
      src: 'https://<你的域名>/tracker.js',
      async: true,
      defer: true,
      'data-website-id': '<你的网站ID>',
    },
  ],
};

module.exports = config;
```
