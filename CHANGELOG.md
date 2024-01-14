

## [1.4.0](https://github.com/msgbyte/tianji/compare/v1.3.1...v1.4.0) (2024-01-14)


### Features

* add apprise notification [#10](https://github.com/msgbyte/tianji/issues/10) ([09c3cfa](https://github.com/msgbyte/tianji/commit/09c3cfa0dc4fb6ace8be0ed1c9e10efaf442d83d))
* add status page delete action ([551f86b](https://github.com/msgbyte/tianji/commit/551f86b8e32eb1c71ef2c73454b8d73362acce41))
* add tcp port monitor ([9892d3a](https://github.com/msgbyte/tianji/commit/9892d3ac5ac22442f488b0cef846f1c11c3407b9))
* allow display current response value in monitor list ([ec591f0](https://github.com/msgbyte/tianji/commit/ec591f0c54eed0af66a40c0ade64e11c32c8164c))


### Bug Fixes

* fix custom display text not apply in health bar ([699fe6c](https://github.com/msgbyte/tianji/commit/699fe6c967cf4ee5278b723c27239957631b82c4))
* fix openai balance calc logic ([1fccb10](https://github.com/msgbyte/tianji/commit/1fccb103fd79fad312dbf9403d935e0726da95af))
* fix status page set monitor list in create action not work problem ([e24d822](https://github.com/msgbyte/tianji/commit/e24d82224ca2bbce8e72caaa07677dd7a2b947bc))


### Document

* update zh readme ([78b2ee8](https://github.com/msgbyte/tianji/commit/78b2ee84f5f7ea232b4fe92284c53d072c2b35c0))


### Others

* add docker build ci ([18867c6](https://github.com/msgbyte/tianji/commit/18867c614e8c3e1892a98f8756848666b816c011))
* add notification picker empty state to guide user to create notification ([a567834](https://github.com/msgbyte/tianji/commit/a567834e459838af6b40c88b086e2f71a5d52fce))
* add url token and fix telegram adapt problem ([e6f0267](https://github.com/msgbyte/tianji/commit/e6f02677e558586633db055a72649a4db7229ff4))
* fix ci problem ([9fec5fc](https://github.com/msgbyte/tianji/commit/9fec5fc02fe3686e962e0b234da7d62cf311685c))
* remove unused action in docker ci task ([3d3f07c](https://github.com/msgbyte/tianji/commit/3d3f07c3806a90183756bcea48452903aec98561))

## [1.3.1](https://github.com/msgbyte/tianji/compare/v1.3.0...v1.3.1) (2024-01-10)


### Bug Fixes

* fix manual start monitor will not loop run bug [#15](https://github.com/msgbyte/tianji/issues/15) ([bcfaab6](https://github.com/msgbyte/tianji/commit/bcfaab6959f56a5c8890937761ce909953d193aa))

## [1.3.0](https://github.com/msgbyte/tianji/compare/v1.2.3...v1.3.0) (2024-01-09)


### Features

* add daily cron job to calc workspace usage ([1fad81f](https://github.com/msgbyte/tianji/commit/1fad81f3ab445bf276c4db234383c1d18c74d2a7))
* add mobile nav menu support ([1e0d077](https://github.com/msgbyte/tianji/commit/1e0d077f2a26e926b7df0ae41a17d2c7101f28d7))
* add monitor badge [#6](https://github.com/msgbyte/tianji/issues/6) ([3e9760d](https://github.com/msgbyte/tianji/commit/3e9760d895bf55e625aa35752e617b8b2701e29e))
* add telegram notification support ([e5a5225](https://github.com/msgbyte/tianji/commit/e5a52257eac5a9cf1aeb38a976b640b7453c8c94))
* add tokenizer for notification ([ce6fd56](https://github.com/msgbyte/tianji/commit/ce6fd56d51c50e9f6cec903a2d753bc3820d9d15))
* add version display ([ac7f401](https://github.com/msgbyte/tianji/commit/ac7f4011cd4dfa0938aea888e7f004d93321c9af))
* dashboard card title allow edit ([d03f60f](https://github.com/msgbyte/tianji/commit/d03f60f6a14be87d1f7f059b625faea5c030512d))


### Bug Fixes

* fix monitor data sorting problem, add order by and add created at for fetch monitor data ([023a657](https://github.com/msgbyte/tianji/commit/023a6573a1b5853ba6e5957e7204430fb0119ba3))
* fix typo error for montior -> monitor ([90f22af](https://github.com/msgbyte/tianji/commit/90f22afe282602d48563b6ccdbc07110e319c5d2))


### Document

* update changelog dark theme color ([f585dba](https://github.com/msgbyte/tianji/commit/f585dba2063d0570ff739079d06e3aee2d3353f6))
* update website document ([0076a3b](https://github.com/msgbyte/tianji/commit/0076a3bed7b8a4cd2bf48d39f8db29f6fa1302fa))
* update wechat image and home page tagline ([0eedd7d](https://github.com/msgbyte/tianji/commit/0eedd7d088ad0bcc74150b733473ed5cb4035ef3))


### Others

* add db debug support ([f9ea835](https://github.com/msgbyte/tianji/commit/f9ea835dac961a3bc56b4f03236dd225310c56ab))
* extract some monitor logic into model ([19e7ed5](https://github.com/msgbyte/tianji/commit/19e7ed516bae41ac80ca9e167f548ae7a0dabfa9))

## [1.2.3](https://github.com/msgbyte/tianji/compare/v1.2.2...v1.2.3) (2024-01-04)


### Bug Fixes

* fix a bug which script not support makeTransferable json which data include null ([824bd89](https://github.com/msgbyte/tianji/commit/824bd89edeb1d453a120c6883b096e7e5a4c6a28))
* fix domain schema check problem in add website server ([a04aa67](https://github.com/msgbyte/tianji/commit/a04aa67f85cee08715aeb5148eb0433eda79a64a))


### Others

* add ci action and update release it config ([1c8b4d9](https://github.com/msgbyte/tianji/commit/1c8b4d9285042c490ed40eecdd74ee09131b05c1))
* improve server status table list display ([28dd506](https://github.com/msgbyte/tianji/commit/28dd506cb4aa10bc17c01c53b9081bdfa6864628))
* improve UI ([deceafa](https://github.com/msgbyte/tianji/commit/deceafad4fb766e81921348b16846f1efe4715d1))
* remove env SERVER_URL and use url to get real server url ([81e7f86](https://github.com/msgbyte/tianji/commit/81e7f8651ae90c97cdd2a6b22bdd4889f171f675))
* update docusaurus config for seo ([927136e](https://github.com/msgbyte/tianji/commit/927136e3fb27bd015fe175d2d8289db43bc50f8a))

## [1.2.2](https://github.com/msgbyte/tianji/compare/v1.2.1...v1.2.2) (2024-01-02)


### Bug Fixes

* fix a bug which can not raise monitor with changeActive if monitor never run before ([e38df27](https://github.com/msgbyte/tianji/commit/e38df2706ebfc59aa0a36294d7a35e4bf9ae1492))


### Document

* add demo link ([4bdc838](https://github.com/msgbyte/tianji/commit/4bdc8380f98e7fb8b83b17a9dd41dde1680edbdb))
* update changelog and update roadmap ([df01dcb](https://github.com/msgbyte/tianji/commit/df01dcb8571b95b6642c2332623e42c4f2e57a06))

## [1.2.1](https://github.com/msgbyte/tianji/compare/v1.2.0...v1.2.1) (2024-01-02)


### Bug Fixes

* add Suspense to fix lazy load problem ([d093df9](https://github.com/msgbyte/tianji/commit/d093df928c9137d11310affafbfa99c6b2dd74ac))

## [1.2.0](https://github.com/msgbyte/tianji/compare/v1.1.0...v1.2.0) (2024-01-01)


### Features

* add custom monitor test code ([3e30535](https://github.com/msgbyte/tianji/commit/3e305351875d873ea03cbf25d1f7790053f4a221))
* add custom script monitor provider ([8dfa679](https://github.com/msgbyte/tianji/commit/8dfa6791277043f39930acd94688d31db531f096))
* add monaco editor for custom monitor provider ([96e2e00](https://github.com/msgbyte/tianji/commit/96e2e008eba1dcbcb004f298b1faa5c5948e1740))


### Bug Fixes

* fix update monitor not update runner problem ([e0e338f](https://github.com/msgbyte/tianji/commit/e0e338f819e2c543e31e8255e8ad3fd35ab94e11))


### Document

* add social block ([aedf719](https://github.com/msgbyte/tianji/commit/aedf719d68bba4d30ec4a1595ab5b6be4a7b2dfa))
* upcase tianji slogan ([4c07229](https://github.com/msgbyte/tianji/commit/4c072290e0353bfade6c6103b311b5d75d59f975))


### Others

* change custom monitor label and formatter ([0c542fa](https://github.com/msgbyte/tianji/commit/0c542faf3bf32b536f0d814de45af8a3caacb1e0))
* split the monitor's manager and runner into different files ([59bd1c4](https://github.com/msgbyte/tianji/commit/59bd1c42f7dbee239324ee3ea75e228859dff0b1))
* update release it json config ([3134f61](https://github.com/msgbyte/tianji/commit/3134f615f5c80bd8aaf40f7e4f553a4f99497860))
