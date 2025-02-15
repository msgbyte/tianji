---
sidebar_position: 1
_i18n_hash: 3e7ad33b9d88240c2ee01504fb17ed2d
---
# Docusaurusでの使用方法

`docusaurus.config.js`にて：

```js
/** @type {import('@docusaurus/types').Config} */
const config = {
  // ...

  scripts: [
    {
      src: 'https://<あなたのドメイン>/tracker.js',
      async: true,
      defer: true,
      'data-website-id': '<あなたのウェブサイトID>',
    },
  ],
};

module.exports = config;
```
