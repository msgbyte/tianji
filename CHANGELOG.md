

## [1.9.2](https://github.com/msgbyte/tianji/compare/v1.9.1...v1.9.2) (2024-04-25)


### Features

* add delete feature for pages ([6500f90](https://github.com/msgbyte/tianji/commit/6500f90096c6b7bd954c75621a22f9b6f87f8e07))


### Bug Fixes

* [#57](https://github.com/msgbyte/tianji/issues/57) fix domain validator must be required problem ([5767d45](https://github.com/msgbyte/tianji/commit/5767d4595ba7a233adf4a13cc7bd7b29f05d2f17))


### Others

* improve domainRegex ([8c64481](https://github.com/msgbyte/tianji/commit/8c6448132070ecc4402ca16c476d4a7e3255bd5c))

## [1.9.1](https://github.com/msgbyte/tianji/compare/v1.9.0...v1.9.1) (2024-04-24)


### Features

* add env DISABLE_AUTO_CLEAR ([5938c38](https://github.com/msgbyte/tianji/commit/5938c38349f25037df9f14b1f06a60e42e78f965))


### Bug Fixes

* fix ping action throw error in windows ([89fed46](https://github.com/msgbyte/tianji/commit/89fed4666d81fbbcfe704aa5a88e0270eafb367a))


### Document

* add document for how to install tianji without docker [#56](https://github.com/msgbyte/tianji/issues/56) ([fe0b596](https://github.com/msgbyte/tianji/commit/fe0b596d29ecdd546110443d9101815f792db4ef))


### Others

* add daily cronjob to clear old monitor data ([3d1be2b](https://github.com/msgbyte/tianji/commit/3d1be2b5e9b20f6ba13ec71b68c047d94e2c171e))
* improve monitor query performance ([f5c13cb](https://github.com/msgbyte/tianji/commit/f5c13cb02f1cbe760ebcb7a0c3c120eff649ded8))
* update polish translation ([#55](https://github.com/msgbyte/tianji/issues/55)) ([47cd26c](https://github.com/msgbyte/tianji/commit/47cd26cd868ccae61207c0702faee48c786967e1))

## [1.9.0](https://github.com/msgbyte/tianji/compare/v1.8.2...v1.9.0) (2024-04-22)


### Features

* add custom domain support for status page ([a737204](https://github.com/msgbyte/tianji/commit/a73720411cd16376e01dac4fc27fb8d29b057045))
* add layout header which ensure title of page is correct ([120df2d](https://github.com/msgbyte/tianji/commit/120df2d8b59c50ca104e83f264193af2aacdd125))
* add pl language support ([761bc71](https://github.com/msgbyte/tianji/commit/761bc712d6a91bce3f622c488bc312ab1ecb9cf6))
* add server count in desktop layout ([720a1d7](https://github.com/msgbyte/tianji/commit/720a1d744ead46a28845bd3e59926ad37e02cb27))


### Bug Fixes

* fix a problem which custom domain canot direct save by domain check ([e2fc922](https://github.com/msgbyte/tianji/commit/e2fc9224c757701031b4c2ce9fe1261db73fcd7f))
* fix monitor edit can not scroll problem ([06ddd9b](https://github.com/msgbyte/tianji/commit/06ddd9b6f108a10331fe02a8e9d89b77300780a5))


### Document

* update document ([92f8700](https://github.com/msgbyte/tianji/commit/92f870025456cf9f9cc6794ea406c0e765b42d6a))


### Others

* improve mobile display for monitor and base layout ([fc259f7](https://github.com/msgbyte/tianji/commit/fc259f7d8e9eb0927005189b4acf796520b7ad6f))
* improve monitor retry logic. make sure send notice when retried ([ffee0b8](https://github.com/msgbyte/tianji/commit/ffee0b8799df8dc6c2537ea4d7e50884faee7591))
* improve style of antd switch in new UI ([1bd18fa](https://github.com/msgbyte/tianji/commit/1bd18fa412955a69c8560bf93af788816dab982a))
* redesign servers table in new design ([ccf7b8d](https://github.com/msgbyte/tianji/commit/ccf7b8d4aa5895b1430f4554924923bd122cffc4))
* update translation ([6e8e6ac](https://github.com/msgbyte/tianji/commit/6e8e6acc70a01a40f36bf8aa2d9b0e1273726355))
* upgrade @i18next-toolkit/cli to v1.2.1 ([f0bd4dd](https://github.com/msgbyte/tianji/commit/f0bd4dd993e18c42b5bac2e81064e2404e6853aa))

## [1.8.2](https://github.com/msgbyte/tianji/compare/v1.8.1...v1.8.2) (2024-04-16)


### Features

* add telemetry event count ([8a3c93f](https://github.com/msgbyte/tianji/commit/8a3c93fff71a42a48041af1008f701e9868982c7))
* add track function ([6349931](https://github.com/msgbyte/tianji/commit/6349931714063edb9d17cb45b1a200bb04d48d25))
* Adding Portuguese (pt-PT) Translation ([#52](https://github.com/msgbyte/tianji/issues/52)) ([49fa50c](https://github.com/msgbyte/tianji/commit/49fa50c3cd12a693738aa4b6a7ef3fbdd9fc1da6))
* telemetry add force to improve url fetch logic ([ac7b44e](https://github.com/msgbyte/tianji/commit/ac7b44e86276819be34ed91eea0b108747fa2c66))


### Document

* update openapi ([1db0832](https://github.com/msgbyte/tianji/commit/1db0832d989123a05f034a128d9717da0091f1b7))
* update README ([8acbbb5](https://github.com/msgbyte/tianji/commit/8acbbb56f5401e62e183e73606feb82a3d2890b4))


### Others

* add title for status page and update UI style for it. ([d3ce409](https://github.com/msgbyte/tianji/commit/d3ce4090022841fa1a7f5624cd958d0ba2dc4e6c))
* fix ci problem ([932d78b](https://github.com/msgbyte/tianji/commit/932d78b172feb4a49a2fd8079180ce9c1f38147f))
* init client sdk ([699aedc](https://github.com/msgbyte/tianji/commit/699aedc272b4ba614280d2cfd92020734303a707))
* remove cache for monitor badge ([10d9438](https://github.com/msgbyte/tianji/commit/10d943854143dff66810793f965d3b0992c569dd))
* rename and add init tracker function ([cdcd6e2](https://github.com/msgbyte/tianji/commit/cdcd6e228467780f87ebab1e2af3f9e22d849196))
* update docker registry name ([48210d2](https://github.com/msgbyte/tianji/commit/48210d29acf50e9fd1d42d23afb22ab431012f2b))
* update translation ([9ce882b](https://github.com/msgbyte/tianji/commit/9ce882ba39b131ad5be89071bd33ff599edeaf4e))
* upgrade i18next-toolkit and ant design icons, and update translation ([1dec411](https://github.com/msgbyte/tianji/commit/1dec411dd342ca2001d8a276bd4076d1b89a59fe))

## [1.8.1](https://github.com/msgbyte/tianji/compare/v1.8.0...v1.8.1) (2024-04-10)


### Bug Fixes

* fix cannot add http monitor problem ([6e68cd1](https://github.com/msgbyte/tianji/commit/6e68cd1985967ba7bcda7aa65287a3367a4d1b7d))


### Document

* update preview images ([4f9cff7](https://github.com/msgbyte/tianji/commit/4f9cff747d1572b69ed7e404b9bee4f389b19581))
* update qrcode ([7df1691](https://github.com/msgbyte/tianji/commit/7df16918903b859f6daf59dd500bc10645484d63))

## [1.8.0](https://github.com/msgbyte/tianji/compare/v1.7.4...v1.8.0) (2024-04-09)


### Features

* add default not found page and dashboard redirect ([3c60261](https://github.com/msgbyte/tianji/commit/3c60261f379e905e8ec7ade80151f3bce00b5789))
* add telemetry route ([f27f3f2](https://github.com/msgbyte/tianji/commit/f27f3f2f11c031cfbbea4a927e5fad3866920a7d))
* add translation for new design ([07f64a8](https://github.com/msgbyte/tianji/commit/07f64a87ff1de761501cd0698adb038a0a3a70b3))
* add website add button and fuse search ([68ace91](https://github.com/msgbyte/tianji/commit/68ace913217bb033537f41a32c224e1fcaf65566))
* **v2:** add all settings pages ([fa7534a](https://github.com/msgbyte/tianji/commit/fa7534a8e00d62a462351b8dbbb06291bb7d2953))
* **v2:** add command panel ([af4c6f6](https://github.com/msgbyte/tianji/commit/af4c6f6bd18c83389f2910b3bc7e3a901d46ca83))
* **v2:** add delete telemetry feature ([07cb0b0](https://github.com/msgbyte/tianji/commit/07cb0b066a1eb40fd333f929dbb5dafde356cb6a))
* **v2:** add mobile layout ([af1d99d](https://github.com/msgbyte/tianji/commit/af1d99d2ff720d48af03bfcd192ce1da627e3fdb))
* **v2:** add monitor health bar in list ([539f242](https://github.com/msgbyte/tianji/commit/539f24244a2b76d395cdca3ee19d29b7a26896d1))
* **v2:** add page list/add/detail ([d97c671](https://github.com/msgbyte/tianji/commit/d97c6719133ee1c2d8c6faa29d18e4520036722d))
* **v2:** add server page ([20e1963](https://github.com/msgbyte/tianji/commit/20e19633aeacf971dfc0c4855604a2c60d58198b))
* **v2:** add website detail ([958b1c0](https://github.com/msgbyte/tianji/commit/958b1c09329864463bef724256aee825b770147e))
* **v2:** add website overview ([6a5de70](https://github.com/msgbyte/tianji/commit/6a5de70fdbf4cbf706274e9f40278fc8dcbd5b25))
* **v2:** monitor feature ([402b8a6](https://github.com/msgbyte/tianji/commit/402b8a6955278937b8512307f304c428d4f3a441))


### Bug Fixes

* fix custom tracker script file route error in production ([2a3e2af](https://github.com/msgbyte/tianji/commit/2a3e2af528e492f587de561988100ada6efb2050))
* fix custom tracker script name not display in fe problem ([5d8c187](https://github.com/msgbyte/tianji/commit/5d8c18716a1502c1db8f95850f0f762bf4455706))
* fix website list not refresh when delete website problem ([fcb30a3](https://github.com/msgbyte/tianji/commit/fcb30a375b8f033592cc5af40602d826d527470c))


### Document

* add docker image size badge ([cc581f9](https://github.com/msgbyte/tianji/commit/cc581f9c2286eb83d7cbb2486ec6c9adc92c1c02))
* add document about telemetry parameters ([a219f3b](https://github.com/msgbyte/tianji/commit/a219f3bdbff44f17e9a24a562770ec3b5952d54b))


### Others

* add AppRouter to make sure useUserStore run under trpc provider ([2c5ff71](https://github.com/msgbyte/tianji/commit/2c5ff71725a10d9c2c5de3c49be94afa198987d0))
* basic new layout ([0987ca3](https://github.com/msgbyte/tianji/commit/0987ca37d53eb0bfc74360f0b6995560b6544e6c))
* improve layout navbar ([6fbf316](https://github.com/msgbyte/tianji/commit/6fbf316c5d1af65a9d741cc5a89798229f5df9c6))
* move add desktop layout into ([0711c3c](https://github.com/msgbyte/tianji/commit/0711c3c003d1e86130afece1178d2fb32d0d7191))
* new layout and new router ([3f13447](https://github.com/msgbyte/tianji/commit/3f13447e1fb29cb87a4beacdf454522dfea9ea3d))
* remvoe old router ([62cc934](https://github.com/msgbyte/tianji/commit/62cc934035683e252368af78ed21975dc2d5d329))
* replace all old router to new router ([3bb2cc8](https://github.com/msgbyte/tianji/commit/3bb2cc871513cc553adfd0e5014a121d098f2aa3))
* shadcn ui init ([aeee6ca](https://github.com/msgbyte/tianji/commit/aeee6ca5932504e7bc7284e4ee46687a59687502))
* **v2:** add common sidebar ([f9a51e4](https://github.com/msgbyte/tianji/commit/f9a51e4c792519b527a467a6f3fecc72e7fbb129))
* **v2:** login view and register and default error handler and more ([4d260dc](https://github.com/msgbyte/tianji/commit/4d260dc45e6509d649f5afa87de9eb2a5123bd6d))

## [1.7.4](https://github.com/msgbyte/tianji/compare/v1.7.3...v1.7.4) (2024-04-03)


### Features

* add custom tracker script [#37](https://github.com/msgbyte/tianji/issues/37) ([16e0cb0](https://github.com/msgbyte/tianji/commit/16e0cb0f112091238109acf38591af23c7b76b92))
* add delete telemetry feature [#34](https://github.com/msgbyte/tianji/issues/34) ([d862e6c](https://github.com/msgbyte/tianji/commit/d862e6cb62b716e1fa64c6b206c1961708d2ed1d))
* add DNS monitor [#45](https://github.com/msgbyte/tianji/issues/45) ([99610cf](https://github.com/msgbyte/tianji/commit/99610cffaeb6da469ce66396d0b6cd6347087d37))
* add telemetry events chart ([941861f](https://github.com/msgbyte/tianji/commit/941861f8856ec02935b221dbbd488226d69884c4))


### Bug Fixes

* fix etag problem for http cache if not show full telemetry number in badge ([bd4e6b5](https://github.com/msgbyte/tianji/commit/bd4e6b5b05b7154b4e34792665e66004bd426286))


### Document

* add docker pull badge in README ([cf5edd4](https://github.com/msgbyte/tianji/commit/cf5edd4ab4b2c8d47d14724902ffc541c5527b33))
* update changelog ([6f556f3](https://github.com/msgbyte/tianji/commit/6f556f3e909ba4a09bf4625bbd9fa3a8924f6e98))
* update qrcode ([f841361](https://github.com/msgbyte/tianji/commit/f84136106a8ca192f4c4c3bc3f0571bcba2c8d22))


### Others

* add article about telemetry introduce ([e06d7ca](https://github.com/msgbyte/tianji/commit/e06d7ca4986bc4926c39c4f3500a45da4d3b9242))
* add default handler for delete telemetry action ([6c84a04](https://github.com/msgbyte/tianji/commit/6c84a04fb5fee6330d836e12766678702e927213))
* add prettier-plugin-tailwindcss ([11fd1a6](https://github.com/msgbyte/tianji/commit/11fd1a616bbff0dcf3b400acf12c865c0cab9aed))
* update qrcode ([f8f8c14](https://github.com/msgbyte/tianji/commit/f8f8c14e23b4619ce82b5e76d108282bc8c2cc01))

## [1.7.3](https://github.com/msgbyte/tianji/compare/v1.7.2...v1.7.3) (2024-03-10)


### Others

* add fullNum props in telemetry badge ([44d5fb3](https://github.com/msgbyte/tianji/commit/44d5fb3f50c8e08fc9cc1e93133dad7883e251bd))
* remove http cache to fit github environment(maybe) ([6f76a04](https://github.com/msgbyte/tianji/commit/6f76a04abe3e572ae56b873b7d2cd6f9e419c15a))

## [1.7.2](https://github.com/msgbyte/tianji/compare/v1.7.1...v1.7.2) (2024-03-09)


### Bug Fixes

* fix telemetry session query failed problem ([c5dfa15](https://github.com/msgbyte/tianji/commit/c5dfa15096e80c030ecc45abef798b74c7676f72))


### Document

* add README visitor countor ([f0a1ed3](https://github.com/msgbyte/tianji/commit/f0a1ed3cdf17f7b0988c03efeb4f3d264100c227))

## [1.7.1](https://github.com/msgbyte/tianji/compare/v1.7.0...v1.7.1) (2024-03-09)


### Bug Fixes

* fix geo library dont copy problem ([b19292e](https://github.com/msgbyte/tianji/commit/b19292e8f69e23ec4a5ba5bff8368b574dc20b53))

## [1.7.0](https://github.com/msgbyte/tianji/compare/v1.6.0...v1.7.0) (2024-03-08)


### Features

* add alpha mode and usage page ([d3df3f2](https://github.com/msgbyte/tianji/commit/d3df3f2692b7bf97759d104f748710afd7b38f00))
* add telemetry event count ([e79c4b4](https://github.com/msgbyte/tianji/commit/e79c4b48190c9c1867210399b13e8e4d7386fcd0))
* add telemetry feature desc ([011ac6c](https://github.com/msgbyte/tianji/commit/011ac6c71389f0430d995396992e649fa0d5bc91))
* add telemetry list ([5e720ab](https://github.com/msgbyte/tianji/commit/5e720abb11ae3615b07155aff320f46b5d8f95d1))
* add telemetry metrics table ([38dd60f](https://github.com/msgbyte/tianji/commit/38dd60feeec35142cd08e4fe4fe2151b5acee400))
* add telemetry overview ([5bad815](https://github.com/msgbyte/tianji/commit/5bad815e62352fa2ee5835233e98d3f1370890b8))
* add telemetry trpc feature ([0bd98ad](https://github.com/msgbyte/tianji/commit/0bd98adf96fde351cda499ca215cedf36d5ec724))
* add tianji anonymous telemetry ([ceef5c4](https://github.com/msgbyte/tianji/commit/ceef5c4b71e89bfdb60bf24406a5ab5b6eb930d7))
* add usage button for telemetry ([daef9ff](https://github.com/msgbyte/tianji/commit/daef9ff08471f3de5a7cf975265d7fae3b28062e))
* telemetry add telemetryId report ([355690e](https://github.com/msgbyte/tianji/commit/355690eb7505a3a3174e88eb7febd17fc0e288c7))


### Bug Fixes

* fix audit log too long will broken style problem ([b02e0b7](https://github.com/msgbyte/tianji/commit/b02e0b75d67cdf7e64e6606adad9496c2ff722af))
* fix logic problem of retry ([ce891e9](https://github.com/msgbyte/tianji/commit/ce891e9254ef82ace8993232b50dee4ffa0673f2))
* fix pageviews not include timezone problem ([439eb83](https://github.com/msgbyte/tianji/commit/439eb83748b2fd6386027fdf63252f0a60ab8582))
* fix telemetry lost timezone problem ([40e1bac](https://github.com/msgbyte/tianji/commit/40e1bac541c198fcd6e35600e17fffe1cdd4ddfd))


### Document

* add framework support document ([1802717](https://github.com/msgbyte/tianji/commit/18027170b8da78a05f362c1fdcfc0cdbfa018514))
* add Q&A for tianji reporter ([b50de6b](https://github.com/msgbyte/tianji/commit/b50de6b4e026491ecc7e33b876a68ba2282c2faf))
* update changelog ([4b35cc0](https://github.com/msgbyte/tianji/commit/4b35cc0588e0e7d0ff54795b5c57fa9bef647b7c))
* update docs, add account tip in intro page ([5d99bff](https://github.com/msgbyte/tianji/commit/5d99bffa87efc5b8279707041c63b6fbd6b42027))
* update intro document ([2afb5e5](https://github.com/msgbyte/tianji/commit/2afb5e55f7689a02542af37e4e98d27f7d8bef53))
* update keyword ([1872a5d](https://github.com/msgbyte/tianji/commit/1872a5d437a1e61a459c16372533b93f6e54a1e0))
* update openapi ([5b36d10](https://github.com/msgbyte/tianji/commit/5b36d10346477a047a0af801a7842ea0fa84e4ae))
* update openapi.json ([6f77452](https://github.com/msgbyte/tianji/commit/6f77452ae9a8dff1849e139c9496a026868ab746))
* update preview/wechat image, and add feature tag of i18n ([a94e10b](https://github.com/msgbyte/tianji/commit/a94e10b93f0233377bc1ac7edbeb5d65c1fc28d1))
* update tianji keywords ([d0c8bf9](https://github.com/msgbyte/tianji/commit/d0c8bf9f0e3e2e0b8d025998e47c0d182f3c6db1))
* update wechat qrcode ([070f499](https://github.com/msgbyte/tianji/commit/070f4990a65cf322611f4ecce798639ba51898dc))


### Others

* add sealos config ([f87e5b3](https://github.com/msgbyte/tianji/commit/f87e5b32f9c08fa3fd31d15547ec559f3f897432))
* improve dockerfile build ([6464a59](https://github.com/msgbyte/tianji/commit/6464a59d791b3fa93ca0b97ca0e1776274bc09b6))
* refactor chart render and perf pageview data handle logic ([4fe61a6](https://github.com/msgbyte/tianji/commit/4fe61a6d7c11c99ce3fd4b8ec0cfa2c78cb5c077))
* refactor website pageview endpoint to trpc ([dd0ad8c](https://github.com/msgbyte/tianji/commit/dd0ad8c5deb217673285ada601c3121815eb37b8))
* remove alpha mode for telemetry ([e387b70](https://github.com/msgbyte/tianji/commit/e387b70c3a1511772a548f727bcadfc4a43a92d0))
* rename MetricsTable to WebsiteMetricsTable ([1306187](https://github.com/msgbyte/tianji/commit/1306187f01e91d400f228bcd3f4c7ed4ad8576d4))
* update docker file to multi stage builds ([ebc91d9](https://github.com/msgbyte/tianji/commit/ebc91d95317418241a01cf580c423947559f593c))
* update translation ([49fc136](https://github.com/msgbyte/tianji/commit/49fc136fb836cfa178c20809f758bbc13cbdaa46))
* upgrade @i18next-toolkit/cli version ([d8b23a7](https://github.com/msgbyte/tianji/commit/d8b23a746801b3f35d9d86126b37eef53bd84f17))
* upgrade i18next-toolkit cli version and add translation of telemetry ([4711987](https://github.com/msgbyte/tianji/commit/4711987779733bc12a156767a87cfd6c19b6c8c7))

## [1.6.0](https://github.com/msgbyte/tianji/compare/v1.5.1...v1.6.0) (2024-02-15)


### Features

* add i18n support [#3](https://github.com/msgbyte/tianji/issues/3) ([bf6b121](https://github.com/msgbyte/tianji/commit/bf6b1210417bdf4f59c8dd5d699a0f862bf356c8))
* add timeout in http monitor [#24](https://github.com/msgbyte/tianji/issues/24) ([8d096d5](https://github.com/msgbyte/tianji/commit/8d096d55e1473af5a4459d73a0ddee37a6b7809c))
* monitor add max retries to avoid network fluctuation ([97d55da](https://github.com/msgbyte/tianji/commit/97d55da4546aa67d96cb6d49b2fe36cb853e9ba6))


### Others

* add i18n update trigger in data filter menu ([80f7933](https://github.com/msgbyte/tianji/commit/80f7933c7b3d1db0551c483819e357c91d36b688))
* add top padding in smtp template ([393e580](https://github.com/msgbyte/tianji/commit/393e58080a54ba8dcc055bee9a1a2ba2b152f495))
* beautify SMTP email style ([461e23b](https://github.com/msgbyte/tianji/commit/461e23be2f57094c47b8ff937ce53c05eec501e4))
* fix ci problem ([0f7b11d](https://github.com/msgbyte/tianji/commit/0f7b11d8422384e771c7ce2164ee5ab72ab058b5))

## [1.5.1](https://github.com/msgbyte/tianji/compare/v1.5.0...v1.5.1) (2024-02-08)


### Bug Fixes

* add table label ellipsis to avoid much long label [#23](https://github.com/msgbyte/tianji/issues/23) ([343c05c](https://github.com/msgbyte/tianji/commit/343c05c3abf52cf70310d49b88f540fc2da5cf2f))


### Document

* update QRCode ([da5149b](https://github.com/msgbyte/tianji/commit/da5149b1665b8271d539c99aa29018dfa8a15633))


### Others

* http url allow link ([e9b783f](https://github.com/msgbyte/tianji/commit/e9b783f0478f67bee0ca81a0115d1680e38c6e3c))
* move delete button into more button dropdown ([70c60b5](https://github.com/msgbyte/tianji/commit/70c60b5ee1f734a955ca38a3c5cf6faf44a2a93f))

## [1.5.0](https://github.com/msgbyte/tianji/compare/v1.4.3...v1.5.0) (2024-02-01)


### Features

* add audit log ([d912c78](https://github.com/msgbyte/tianji/commit/d912c788c534a5aff956d5a4b7d1f45208cc5d5e))
* add leaflet visitor map if user not wanna register any token ([3baa1ab](https://github.com/msgbyte/tianji/commit/3baa1ab55b8ab399fd2b5a50840ac5d0162ae28c))
* add previous period in website overview ([8ff5db8](https://github.com/msgbyte/tianji/commit/8ff5db80e21a8489a347be7a907cb5dad8f37aba))
* add some audit log for monitor ([a176bbc](https://github.com/msgbyte/tianji/commit/a176bbcfb47d1b1fa2d3e8afb49785338df27580))
* add visitor map entry button in country list ([835d7ff](https://github.com/msgbyte/tianji/commit/835d7ff43d77a236443929e52b75da6a2ecc9d9c))
* add website visitor map ([5c633ae](https://github.com/msgbyte/tianji/commit/5c633ae38c21ee5e7a4a46ae0ee93c50efd8ef93))
* add workspace audit log db model ([7243b99](https://github.com/msgbyte/tianji/commit/7243b991ae4ed5978b365994896de26669863ab1))
* parse ip location and storage in db ([99a6c91](https://github.com/msgbyte/tianji/commit/99a6c91b1b63eb0b07ed8f05b42175f8ea6d9f51))


### Bug Fixes

* add more space in network traffic column [#20](https://github.com/msgbyte/tianji/issues/20) ([c8671e8](https://github.com/msgbyte/tianji/commit/c8671e865699edcf4d4ebce09acc1ef3470a7357))
* fix @tianji/shared build problem ([f5f0a56](https://github.com/msgbyte/tianji/commit/f5f0a560f1e45bddd8e4034699ef31feb00ff3b8))
* fix a bug which data will reuse prev state in notification in production ([5c2e0e4](https://github.com/msgbyte/tianji/commit/5c2e0e46e1a081d63a53c1aaf1497798c5f3ce8b))
* fix library path load problem ([c049a62](https://github.com/msgbyte/tianji/commit/c049a624933e26ed8f4dabfa0e9e19534f1d1829))


### Document

* fix README/website style problem ([63a3e7c](https://github.com/msgbyte/tianji/commit/63a3e7c78121a7eabb3823cdf65f832466d5e4ee))
* improve changelog date string display ([bb26196](https://github.com/msgbyte/tianji/commit/bb26196179d6c98363771955edae2858b383533d))
* update qrcord ([211e921](https://github.com/msgbyte/tianji/commit/211e92100b74d0b90b481fccd8361027ef87df00))
* update wechat ([d2171ce](https://github.com/msgbyte/tianji/commit/d2171ce2b34494bc58563de2ff2dba5de8a32718))


### Others

* add audit log list empty state ([f153145](https://github.com/msgbyte/tianji/commit/f153145e0d3c19df256a0329fe1b92121d0d55a7))
* add config ([48605ab](https://github.com/msgbyte/tianji/commit/48605abe245250dea1f6b073150caaff53e877cd))
* add global ts-node in root path ([1063eca](https://github.com/msgbyte/tianji/commit/1063eca4ff6cd695987b2c74b38a330df4f73e65))
* add populate ip location script ([788b43b](https://github.com/msgbyte/tianji/commit/788b43b86d1855e0f220d4a2796ad9896da406af))
* add settings menu in user menu ([00a0459](https://github.com/msgbyte/tianji/commit/00a045915e7bc651d10273b82377856cba059fc0))
* add shared packacage ([39550ec](https://github.com/msgbyte/tianji/commit/39550ece8339ea98915ba1b41398548d31e8c09a))
* change project strcut to monorepo ([601c167](https://github.com/msgbyte/tianji/commit/601c167d365e73dbd6b3f036d4930bc66fdf7759))
* change website stat endpoint to trpc ([537edcf](https://github.com/msgbyte/tianji/commit/537edcf5066fee879be2506dab17e0e583ed9729))
* docker base image change to node 18 ([88a87a4](https://github.com/msgbyte/tianji/commit/88a87a4b58678061e6acc43b40e1713439ea54b6))
* fix ci problem ([0502185](https://github.com/msgbyte/tianji/commit/0502185e7cb14150ae497a5bf218f85e5bc69807))
* fixpnpm run path problem ([814c7bf](https://github.com/msgbyte/tianji/commit/814c7bf237a75cd65cb46d635a2af2aee170c6b0))
* improve dev env support ([70f0f56](https://github.com/msgbyte/tianji/commit/70f0f56b47f71d7dd62c9c502d553a3c491cf9e2))
* improve monitor badge display, add title in copy text ([4a1ea85](https://github.com/msgbyte/tianji/commit/4a1ea8557aa2620573806ec1bb33536a1c676ec8))
* improve SEO description ([4ed941b](https://github.com/msgbyte/tianji/commit/4ed941b013a24ca3e1603cbec68c415438710ec4))
* remove kill others in @tianji/shared build ([dde617f](https://github.com/msgbyte/tianji/commit/dde617fa0cdbd3e29f6c484661e7a445409e627c))
* resolve shared import problem in production ([486587f](https://github.com/msgbyte/tianji/commit/486587f232190d271b82b576c5d60e398cc67846))
* run db:generate at first ([8a42ef6](https://github.com/msgbyte/tianji/commit/8a42ef616ee49bb09acbef4f2c2a424acab3b1a9))
* update build track.js output path ([74948ff](https://github.com/msgbyte/tianji/commit/74948ff53394caa80dfbda10c42638f83ed12429))
* update docker file, move to 20-alpine ([caad780](https://github.com/msgbyte/tianji/commit/caad780e9a5d77b83bbd1822ced5cd88f93b1dcf))
* update dockerfile, move python3 into bottom to avoid compile isolated-vm ([153e2bf](https://github.com/msgbyte/tianji/commit/153e2bf499b3bbf253c565a822573d751d8000cb))
* update dockerfile, try use 20-bullseye ([9b0db9e](https://github.com/msgbyte/tianji/commit/9b0db9e444730e7a35fb20d95c4582972de0a706))
* upgrade isolated-vm ([bf1604d](https://github.com/msgbyte/tianji/commit/bf1604d9eccd011559cdc678b80748985640f60e))

## [1.4.3](https://github.com/msgbyte/tianji/compare/v1.4.2...v1.4.3) (2024-01-14)


### Others

* update base image to node:20-bookworm ([4a4f08b](https://github.com/msgbyte/tianji/commit/4a4f08b300b26c1e0bdb6c701c7103fa52a7b04d))

## [1.4.2](https://github.com/msgbyte/tianji/compare/v1.4.1...v1.4.2) (2024-01-14)


### Others

* change docker base image to node:20-bookworm-slim ([65c37d8](https://github.com/msgbyte/tianji/commit/65c37d89a0b0276dc55dbdeccde8fd699bf15485))
* update docker publish action config ([6b74e60](https://github.com/msgbyte/tianji/commit/6b74e605ada8296fd6e14d746de14f25aad0bf4c))

## [1.4.1](https://github.com/msgbyte/tianji/compare/v1.4.0...v1.4.1) (2024-01-14)


### Bug Fixes

* fix pip install problem when docker build ([fb8184f](https://github.com/msgbyte/tianji/commit/fb8184fe9cde26e7991e05f3833adfec1a0a7206))


### Others

* update docker ci push conditions ([a7a7e6b](https://github.com/msgbyte/tianji/commit/a7a7e6b87dd7cbe2cfe16da53a458f65e9ac181e))

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
