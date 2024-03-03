---
sidebar_position: 1
---

# Use in Docusaurus

In `docusaurus.config.js`:


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
