

## [1.24.1](https://github.com/msgbyte/tianji/compare/v1.24.0...v1.24.1) (2025-07-18)

### Features

* add batch endpoint for website events ([44d45b2](https://github.com/msgbyte/tianji/commit/44d45b2d59558d7f6871b928813b69aaaf22f131))
* add pure website tracking functions and update existing tracker to utilize them ([0662362](https://github.com/msgbyte/tianji/commit/0662362f29d2172e8b481590e094e778bbd65f48))
* add WebsiteVisitorMap route and enhance map components with full-screen support ([fc6266f](https://github.com/msgbyte/tianji/commit/fc6266fffd3c776c2b43a9692adffd96786b916f))
* implement batch request handling for website events and enhance tracking options ([38bd5e9](https://github.com/msgbyte/tianji/commit/38bd5e9c26f9b7bbd6671e356cdacee1f606a5a8))

### Bug Fixes

* fix a bug which insight can not good handle timezone problem when in different timezone ([a20cb7a](https://github.com/msgbyte/tianji/commit/a20cb7ae5f6231d944319924e382317568fd52ac))

### Document

* update changelog page ([e06d1b5](https://github.com/msgbyte/tianji/commit/e06d1b506c7b9a5457ac34e554dabdb03488709e))

### Others

* add TypeScript tracker implementation and update build entry point ([fcc7f94](https://github.com/msgbyte/tianji/commit/fcc7f94b883ee257e91611946607c3f0ee4bc51d))
* redesign changelog page ([658c045](https://github.com/msgbyte/tianji/commit/658c045ed1828a4e9067e3b1b7e22947043d6317))
* simplify insightsAIGateway function by utilizing processGroupedTimeSeriesData ([58369d4](https://github.com/msgbyte/tianji/commit/58369d4d6a2d17a198cf8651cfa5bd64b3684f11))
* update model prices ([46ba80d](https://github.com/msgbyte/tianji/commit/46ba80db81d478c6be1940ae62391c11c052c2ed))
* update tracking functions to use new website event reporting methods ([2494227](https://github.com/msgbyte/tianji/commit/2494227933b1fe477d8d34755a3fab1d2ebad07f))

## [1.24.0](https://github.com/msgbyte/tianji/compare/v1.23.5...v1.24.0) (2025-07-15)

### Features

* add ClickHouse health check manager and integrate it into insights query handling ([b755b63](https://github.com/msgbyte/tianji/commit/b755b632424f258e1b0994161bcfd2cf7727c194))
* add clickhouse infrastructure ([23ea9c1](https://github.com/msgbyte/tianji/commit/23ea9c1da2965ba40f686343bb5769812b71c50b))
* add clickhouse insights support ([4fdfacd](https://github.com/msgbyte/tianji/commit/4fdfacdef9fe0241ae90e04e033e331b7dd23b63))
* implement transaction handling in migration process and improve SQL query parameterization ([bd1a866](https://github.com/msgbyte/tianji/commit/bd1a866eb8d5ca0ec302a759e15b48e31953c052))

### Bug Fixes

* fix a bug which last_sync_timestamp incorrect ([6ac7250](https://github.com/msgbyte/tianji/commit/6ac7250f0f17b831c92f2760a859cd66e387939c))

### Others

* add CLICKHOUSE_DISABLE_SYNC environment ([8de9899](https://github.com/msgbyte/tianji/commit/8de9899d1c4b18be46f2f6abe09195bd6a79f9a7))
* add sdk environment check before run browser only logic ([407ab74](https://github.com/msgbyte/tianji/commit/407ab74e1721042b38d98aa6ca06f6c139c158c3))
* change client sdk tracker path ([83c50bb](https://github.com/msgbyte/tianji/commit/83c50bbbd45578b1157670511c86ca484ee4efb9))
* **example app:** add Tianji tracking functionality with page view simulation and user session management ([0eeb672](https://github.com/msgbyte/tianji/commit/0eeb6722919ab7411b9e6446807c1d604a6331e4))
* simplify SQL query construction for ClickHouse and PostgreSQL ([1ade1fb](https://github.com/msgbyte/tianji/commit/1ade1fb637a432e3b580ee2cf42561f0564c66fe))
* update ClickHouse env examples ([f0ff7cf](https://github.com/msgbyte/tianji/commit/f0ff7cf34f1cfeeeac732555f4bc52c0c66082de))
* update dependencies and bump docker version ([7d007b5](https://github.com/msgbyte/tianji/commit/7d007b5cbbcc866cfca4c1600c4bd8cd3bd3e039))

## [1.23.5](https://github.com/msgbyte/tianji/compare/v1.23.4...v1.23.5) (2025-07-13)

### Features

* add direction prop to FilterParamsBlock and update FilterSection for horizontal layout ([ed17bbb](https://github.com/msgbyte/tianji/commit/ed17bbb3c501ab97c373762f62218224ba1bf686))
* enhance event display with object serialization and custom collapse icon ([a7e5efa](https://github.com/msgbyte/tianji/commit/a7e5efa88ed01bb0e9cffb6f16bfeb3468580b55))

### Bug Fixes

* fix insights event feature session data incorrect problem ([2c2b570](https://github.com/msgbyte/tianji/commit/2c2b5704c5dd10a85e0f21e6c4756e44a0d6fe53))

### Others

* fix filter not work issue in fetch event ([107de00](https://github.com/msgbyte/tianji/commit/107de0006a7e6101be2d6590dc61fa1844ebeb35))

## [1.23.4](https://github.com/msgbyte/tianji/compare/v1.23.3...v1.23.4) (2025-07-10)

### Features

* upgrade go runtime and upgrade gopsutil version and add process command support ([a17a4b4](https://github.com/msgbyte/tianji/commit/a17a4b44e956ae8f0cd43d0c940ec7f38f28f6e3))

## [1.23.3](https://github.com/msgbyte/tianji/compare/v1.23.2...v1.23.3) (2025-07-09)

### Features

* add bar chart support ([a6839c3](https://github.com/msgbyte/tianji/commit/a6839c346ddc6166aea26e98b0c91cbdb4588331))
* add default and max result limits for insights queries to avoid performance issues ([47eb27e](https://github.com/msgbyte/tianji/commit/47eb27e4cdf812f21380fea73ee916adef208d14))
* add pie chart view type ([f9e7c26](https://github.com/msgbyte/tianji/commit/f9e7c2614c553ec7708fecb9507eb683871ce9af))
* add server timezone options in global config ([ec3f5ac](https://github.com/msgbyte/tianji/commit/ec3f5ac8d4b88a17cffecc8eb48ff477cc9ac541))
* add timezone support for insights components and add presist date setting ([0bf04a2](https://github.com/msgbyte/tianji/commit/0bf04a2f07bc0519d82918403eee0ba618eadbbf))

### Document

* update yandex verify html ([8cf94d9](https://github.com/msgbyte/tianji/commit/8cf94d9d59f80977fea0dec7f4514e610863e043))

### Others

* improve display for table view ([e6bd1e3](https://github.com/msgbyte/tianji/commit/e6bd1e30932ef5ed204f4d39a9b92f4bcdc1a92a))
* remove ai category which should not filter or group ([000253f](https://github.com/msgbyte/tianji/commit/000253fd20bc6b38efbbbc6d71cd837f69caa7f0))

## [1.23.2](https://github.com/msgbyte/tianji/compare/v1.23.1...v1.23.2) (2025-07-07)

### Features

* add more group support for insightsSurveyBuiltinFields ([eac0c65](https://github.com/msgbyte/tianji/commit/eac0c65d905ff5aede93c64c915cd27e5992b433))

## [1.23.1](https://github.com/msgbyte/tianji/compare/v1.23.0...v1.23.1) (2025-07-07)

### Features

* add in list filter support in string operator ([e68cc15](https://github.com/msgbyte/tianji/commit/e68cc150d35d254f0655d10c19e6e23906b29a79))

### Bug Fixes

* fix a problem which can not support insight input and save ([9ce3a8d](https://github.com/msgbyte/tianji/commit/9ce3a8d4ff4a02d09eb968776511381c55025935))

### Others

* translation ([b98c630](https://github.com/msgbyte/tianji/commit/b98c6302706613c897aac89ff89bf9ec763e858d))

## [1.23.0](https://github.com/msgbyte/tianji/compare/v1.22.6...v1.23.0) (2025-07-06)

### Features

* add server status option for status pages ([f281d1d](https://github.com/msgbyte/tianji/commit/f281d1d8b30b0427c6447784edb49f92446b5a55))
* add tipicon which tell user how to use api key ([174d1df](https://github.com/msgbyte/tianji/commit/174d1df781e8d4f8ad5a674cc609c8d7135671e8))
* add tooltip of user invitation which SMTP maybe not config [#180](https://github.com/msgbyte/tianji/issues/180) ([c721595](https://github.com/msgbyte/tianji/commit/c721595a876e1c42044678a2f4f946c943924a3b))

### Bug Fixes

* fix tooltip can only display part issue ([d9678f3](https://github.com/msgbyte/tianji/commit/d9678f3481d3d12b814e40c29810784ed8d86d64))

### Others

* improve display for server status page ([4513026](https://github.com/msgbyte/tianji/commit/4513026a63fcc143d5adf14ef9d3449cf818ad47))

## [1.22.6](https://github.com/msgbyte/tianji/compare/v1.22.5...v1.22.6) (2025-07-05)

### Features

* add multiselectpopover logic which support filter reference value ([4b11135](https://github.com/msgbyte/tianji/commit/4b111352202e29a4a7c79498750a644698ee4e4e))
* **insights:** add filterParamValues query for website and survey insights ([7d7e65e](https://github.com/msgbyte/tianji/commit/7d7e65e8e493e402b9825000529c5342c3bb385a))
* **status-page:** toggle detail display ([5a3a336](https://github.com/msgbyte/tianji/commit/5a3a336ec5a79e89a3cca64dce4c57ea158b5bac))

### Bug Fixes

* fix survey create page can not scroll if form is too large ([96d9c79](https://github.com/msgbyte/tianji/commit/96d9c79f31023ff94539ca1f7b2dbdf7cda5f4ec))

### Document

* add kubernetes reporter daemonset ([80d5b7f](https://github.com/msgbyte/tianji/commit/80d5b7fae6569c6ffcef17e112f38c1d12b5ae0f))
* add translation file note ([2e4da45](https://github.com/msgbyte/tianji/commit/2e4da453c420f1ccab13c820bf1958618954b565))

### Others

* update valueFormatter to format numbers with locale ([a76890d](https://github.com/msgbyte/tianji/commit/a76890d9494df1443cfa093f9c0a097a64bf591b))

## [1.22.5](https://github.com/msgbyte/tianji/compare/v1.22.4...v1.22.5) (2025-06-28)

### Features

* add yAxisDomain to time event chart and improve history display ([235920a](https://github.com/msgbyte/tianji/commit/235920aee10ec10fc4b1c9ef664552304cff9c13))
* enhance database configuration with debug and transaction options ([812bfe5](https://github.com/msgbyte/tianji/commit/812bfe571674f5ecf70044ea88d625faaf7f64b7))
* **server-status:** implement caching for server status and history, update related functions to support async operations ([ca7cb73](https://github.com/msgbyte/tianji/commit/ca7cb738fbb83d963903cd277f8a658348c79676))

### Document

* add document for traefik plugin ([1493d4a](https://github.com/msgbyte/tianji/commit/1493d4a1a386db3fa4267029344db667ae1889cb))
* change website domain to tianji.dev ([30834aa](https://github.com/msgbyte/tianji/commit/30834aad73179bd5f642833428dee4a68e4f3f11))
* move traefik with plugin document position ([422fbde](https://github.com/msgbyte/tianji/commit/422fbdec40b93a11eca463e5921fe6710cdc9160))

### Others

* change docker start script, redirect tianji-reporter output to /dev/null for cleaner logs ([0034253](https://github.com/msgbyte/tianji/commit/0034253944015446f25d388b1e898a093c3b0763))
* migrate traefik tianji plugin to independent repo ([0718edb](https://github.com/msgbyte/tianji/commit/0718edb39d9813eb3d1848efcacaf3369cae3a01))
* update translation ([d7e94fc](https://github.com/msgbyte/tianji/commit/d7e94fca3ef27aa46bd413b4b5955ec3b1193168))

## [1.22.4](https://github.com/msgbyte/tianji/compare/v1.22.3...v1.22.4) (2025-06-25)

### Features

* add process stats support ([6079501](https://github.com/msgbyte/tianji/commit/607950178ce2d7f8beaeff5090a0e3485a3400e7))
* add ServerCard and ServerCardView components for improved server monitoring display ([79a026e](https://github.com/msgbyte/tianji/commit/79a026e441d19d6366eb0c7540d577299a677904))
* **server-status:** add history caching and chart ([4c9c938](https://github.com/msgbyte/tianji/commit/4c9c93852dab03a6996f72c0fe53f03d7a627896))

### Document

* fix typos and env variable ([7ca6fff](https://github.com/msgbyte/tianji/commit/7ca6fff64a8da4601e78f6e31d4b5a9b99f8260d))

### Others

* add translation ([9331c6a](https://github.com/msgbyte/tianji/commit/9331c6a349b45d708a6fbf73fa8076e492c34525))
* fix ci issue ([257ecad](https://github.com/msgbyte/tianji/commit/257ecad0fe679087ca7c3350719030f6c6b62f75))
* fix ci type issue ([d6328b4](https://github.com/msgbyte/tianji/commit/d6328b4435ece16186996cc08e551e3714886189))
* scale timeout time to 10x which added more tolerance ([f6ba75e](https://github.com/msgbyte/tianji/commit/f6ba75ecef841193b869d82fbaf05ebec5c5498a))

## [1.22.3](https://github.com/msgbyte/tianji/compare/v1.22.2...v1.22.3) (2025-06-22)

### Others

* update server list header name to improve display ([76236e9](https://github.com/msgbyte/tianji/commit/76236e9bf0a8bac28800a72d836730bcde713c4d))
* upgrade reporter version from 1.21.1 to 1.22.5 ([49f90af](https://github.com/msgbyte/tianji/commit/49f90afac845a9504bfacc6534d83d40f5051432))

## [1.22.2](https://github.com/msgbyte/tianji/compare/v1.22.1...v1.22.2) (2025-06-22)

### Features

* add start tianji container shell and which make tianji report can build in report self ([d420443](https://github.com/msgbyte/tianji/commit/d420443735a2fa0fb823ffff395d771123e2667e))

### Document

* add document about docker monitoring ([c2354f6](https://github.com/msgbyte/tianji/commit/c2354f69ff317e822d5412ab82513e78f4becf95))

### Others

* change run strategy of ai classify ([8923df3](https://github.com/msgbyte/tianji/commit/8923df34fadfcf5d47db73f5b01eabd2d8105150))
* improve example app style ([60af300](https://github.com/msgbyte/tianji/commit/60af3005b6c17d9f989408c85288769153d7936b))
* upgrade wrangler version ([ff3c4a5](https://github.com/msgbyte/tianji/commit/ff3c4a569d093737c07c07c27a4a5dfd861f0e0d))

## [1.22.1](https://github.com/msgbyte/tianji/compare/v1.22.0...v1.22.1) (2025-06-20)

### Features

* add recent suggestion category feature to Survey model and remove auto input suggestion category ([f2a8184](https://github.com/msgbyte/tianji/commit/f2a81847b0b515fa7f042429883f3a382ce087b3))
* add Tianji plugin for Traefik [#142](https://github.com/msgbyte/tianji/issues/142) ([b1d97e9](https://github.com/msgbyte/tianji/commit/b1d97e9d27b5064330c9072c1e7ce5f9fd3327c4))
* improve daily ai trigger logic which can use recentSuggestionCategory ([b302104](https://github.com/msgbyte/tianji/commit/b3021044c5e6e89cb2d0ac03ef66ef674c2fa16f))
* intro new visitor map layer style which fit on black and light theme ([32e3fa1](https://github.com/msgbyte/tianji/commit/32e3fa15fa31c26daa65b1aceff8f3d8d6aa86b6))

### Bug Fixes

* fix openapi swagger can not call self problem ([35f41de](https://github.com/msgbyte/tianji/commit/35f41de72c48ef78632b55a113c7478c2643d6b7))

### Others

* improve openapi ui page which maybe more prettier ([213f366](https://github.com/msgbyte/tianji/commit/213f366afcb50860e194f3a09daf133118ee4500))

## [1.22.0](https://github.com/msgbyte/tianji/compare/v1.21.17...v1.22.0) (2025-06-18)

### Bug Fixes

* change env and fix a bug which OPENAI_ will exposing to other openai instance. ([2ff7f16](https://github.com/msgbyte/tianji/commit/2ff7f16ab1e7aef03f3049018bc3e5bf9bf9bc5f))

## [1.21.17](https://github.com/msgbyte/tianji/compare/v1.21.16...v1.21.17) (2025-06-18)

### Bug Fixes

* fix a bug which website event throw error if can not create session together ([0592355](https://github.com/msgbyte/tianji/commit/0592355841c41dec762fbfce6a673bd05aec83c7))

### Others

* improve display for common list and ai gateway example ([afa4391](https://github.com/msgbyte/tianji/commit/afa439168cc27391343e25f29faccf2cd355bc6c))

## [1.21.16](https://github.com/msgbyte/tianji/compare/v1.21.15...v1.21.16) (2025-06-17)

### Others

* update lock file ([c8f5fb3](https://github.com/msgbyte/tianji/commit/c8f5fb3d2f15ac55a3b1bf8240f506ea1cb078d1))

## [1.21.15](https://github.com/msgbyte/tianji/compare/v1.21.14...v1.21.15) (2025-06-17)

### Bug Fixes

* fix update problem when switch page in admin which maybe not update data ([042cc8d](https://github.com/msgbyte/tianji/commit/042cc8ddf48a20efeb1404d659fa7a13a548c06a))

### Others

* add more logs ([f39e7fb](https://github.com/msgbyte/tianji/commit/f39e7fb8b64c653a8a3904d5b177a8389a9d153e))
* remove unused time markers in MonitorHTTPTiming ([2e1ebb8](https://github.com/msgbyte/tianji/commit/2e1ebb8730ad2e093b86cd2804c56287c887240e))
* update translation ([4a6ea01](https://github.com/msgbyte/tianji/commit/4a6ea01559d005a6105026efa6ab61378e4feea3))
* upgrade dependency version ([79467e2](https://github.com/msgbyte/tianji/commit/79467e2b807f873757e429cf6c56b0c3a739831f))

## [1.21.14](https://github.com/msgbyte/tianji/compare/v1.21.13...v1.21.14) (2025-06-16)

### Features

* add AIGatewaySummaryStats component and integrate it into AIGatewayOverview ([1a04d0a](https://github.com/msgbyte/tianji/commit/1a04d0a54920d0b05779ff38c05ae193e2406abe))
* add FOCUS_CATEGORY support ([075e08d](https://github.com/msgbyte/tianji/commit/075e08d51523c2fa25384c11969e64a8d0181ba1))
* add MonitorHTTPTiming component to display detailed HTTP request timing metrics in MonitorInfo ([a89ddbe](https://github.com/msgbyte/tianji/commit/a89ddbeb3dfd094b3158246a188c45c7afe461dd))
* add timedFetch utility for HTTP requests with detailed timing metrics and integrate it into the monitor provider ([205cee6](https://github.com/msgbyte/tianji/commit/205cee69b03f1537f6ce26ded6e21fb92fae8945))
* add tooltips to HTTP timing phases for better user guidance ([ad8c9fa](https://github.com/msgbyte/tianji/commit/ad8c9facdb2d015ee9c1794b0dc255850228c95a))

### Others

* improve animation of timing component ([fa3cbce](https://github.com/msgbyte/tianji/commit/fa3cbceb73e24c9d7275bb48f2765c68683f29aa))
* simplify MonitorHTTPTiming component structure and improve timing metrics display ([a01fb40](https://github.com/msgbyte/tianji/commit/a01fb40ecf3d76901e5be549d219cd509cfc3345))
* update translation ([4f7e7de](https://github.com/msgbyte/tianji/commit/4f7e7de695c96c73fa037228581244119424ec78))

## [1.21.13](https://github.com/msgbyte/tianji/compare/v1.21.12...v1.21.13) (2025-06-13)

### Features

* add template support for ai translation worker which easy to translate mul-field ([7c7dbc3](https://github.com/msgbyte/tianji/commit/7c7dbc39d4ad71e83371f19e34ad50b00f773429))

### Others

* update app store and Google Play reviews fetching to use async/await for better error handling ([81bf407](https://github.com/msgbyte/tianji/commit/81bf4071d943fe71330c8a144be8480d6cb8067b))

## [1.21.12](https://github.com/msgbyte/tianji/compare/v1.21.11...v1.21.12) (2025-06-11)

### Bug Fixes

* fix a bug which normal user can not see example ([6d607a9](https://github.com/msgbyte/tianji/commit/6d607a969011e3596b3b0017ee95062448a78960))

### Document

* add installation link for Tianji MCP server ([250a1e7](https://github.com/msgbyte/tianji/commit/250a1e7a62d4f618c8a34ab2aa25633e7fca79f9))
* remove unused section ([b39faf2](https://github.com/msgbyte/tianji/commit/b39faf20de2c062c11f94aaceacc5755b4711f75))

### Others

* ai gateway add anthropic api ([79d403a](https://github.com/msgbyte/tianji/commit/79d403a938ab08a9614db4de127c6c1eceb026c9))
* update email template style ([0a63cf3](https://github.com/msgbyte/tianji/commit/0a63cf3a8319947126a9cda1944718f668454f7e))
* update model price and context window config ([a769d71](https://github.com/msgbyte/tianji/commit/a769d71b577a95bd68ae1a231c69fa14e1ce9d18))

## [1.21.11](https://github.com/msgbyte/tianji/compare/v1.21.10...v1.21.11) (2025-06-08)

### Features

* add application batch endpoint ([d1ff4e6](https://github.com/msgbyte/tianji/commit/d1ff4e6f7b78bf904e9e65d4bd1b1ba4c31057c1))
* add custom mode setting feature ([9227ddb](https://github.com/msgbyte/tianji/commit/9227ddba714bc7efeffa48e8dbe4a02b8ff2ef70))
* add manual refresh button to ai gateway logs ([b3eba5f](https://github.com/msgbyte/tianji/commit/b3eba5f2aeb9840d32ffa66f6746ae9db4db40d0))
* add render function for nullable values in AIGateway log columns ([b7dd1d9](https://github.com/msgbyte/tianji/commit/b7dd1d92b4e03d168295032e2a0aeca62bc5bbc8))

### Others

* improve style and improve code handle for calc cost ([bb14b5a](https://github.com/msgbyte/tianji/commit/bb14b5ae5b678c0f5477d6beecd163d0271aab12))
* translation ([cac7519](https://github.com/msgbyte/tianji/commit/cac7519932234ddf09f00deb09981237947a05cb))

## [1.21.10](https://github.com/msgbyte/tianji/compare/v1.21.9...v1.21.10) (2025-06-05)

### Document

* add troubleshooting for websocket connection issues ([0db2013](https://github.com/msgbyte/tianji/commit/0db2013fc67de24a7f648698895dcb859d03c33f))

### Others

* add AUTH_USE_SECURE_COOKIES env var to try to resolve ws and https mix problem ([605443f](https://github.com/msgbyte/tianji/commit/605443f907265c1f3301f8d450e0478dd41e62c5))
* improve secure cookie handling in getAuthSession function ([00b6e2d](https://github.com/msgbyte/tianji/commit/00b6e2d6e53cd1bdda12be1e7e706ac3352b7e4a))

## [1.21.9](https://github.com/msgbyte/tianji/compare/v1.21.8...v1.21.9) (2025-06-04)

### Others

* add more context for debug ([f347440](https://github.com/msgbyte/tianji/commit/f3474406dd2f6d89995be022eed1607c6e9b1e54))

## [1.21.8](https://github.com/msgbyte/tianji/compare/v1.21.7...v1.21.8) (2025-06-04)

### Others

* add more logs ([00286ef](https://github.com/msgbyte/tianji/commit/00286efa68e11bbe0ca2115eda9205f4bc8ec43d))

## [1.21.7](https://github.com/msgbyte/tianji/compare/v1.21.6...v1.21.7) (2025-06-04)

### Bug Fixes

* handle case when CPU information is unavailable, returning 0.0 as fallback [#193](https://github.com/msgbyte/tianji/issues/193) ([80d1be4](https://github.com/msgbyte/tianji/commit/80d1be40d3f752675df9631677566f7775cd9733))

### Document

* update env document ([9c0838e](https://github.com/msgbyte/tianji/commit/9c0838e39315caa5713f43605f6bc6058ffb4df1))

### Others

* add more log for get auth session which maybe can help to debug ([5eb57f4](https://github.com/msgbyte/tianji/commit/5eb57f438785f167fe6b76d6e3ec81c67e28ae32))

## [1.21.6](https://github.com/msgbyte/tianji/compare/v1.21.5...v1.21.6) (2025-06-02)

### Bug Fixes

* improve JSON parsing and handling of quotes in user feedback ([b6368ba](https://github.com/msgbyte/tianji/commit/b6368baf0f470213c327d5d768e55c84955045a1))

## [1.21.5](https://github.com/msgbyte/tianji/compare/v1.21.4...v1.21.5) (2025-06-02)

### Bug Fixes

* try to fix quote bad case in sonnet which maybe more fit to real world case. ([08a8c5f](https://github.com/msgbyte/tianji/commit/08a8c5fc5382c937705f628dfcc71a13e24d3395))

## [1.21.4](https://github.com/msgbyte/tianji/compare/v1.21.3...v1.21.4) (2025-06-02)

### Bug Fixes

* try to handle sonnet problem in translation prompt ([e0587ac](https://github.com/msgbyte/tianji/commit/e0587acc4b04cb8827bc2aade9d2802b33840a11))

## [1.21.3](https://github.com/msgbyte/tianji/compare/v1.21.2...v1.21.3) (2025-06-01)

### Features

* add modelApiKey which can use same api key in one team ([43b1bbe](https://github.com/msgbyte/tianji/commit/43b1bbe9d2ee0868f66dbf9d7d61115c73e894e1))
* add partial to save to database because translation task have more bad case to parse json format ([6a125d5](https://github.com/msgbyte/tianji/commit/6a125d54af8d78d56ce2c65321f96f610f69b62d))

### Document

* add authentication and getting started documents in multiple languages ([917306a](https://github.com/msgbyte/tianji/commit/917306a78d17fd91955287fc5af8473417a405b9))

## [1.21.2](https://github.com/msgbyte/tianji/compare/v1.21.1...v1.21.2) (2025-05-30)

### Bug Fixes

* fix sonnet mode will output invalid json problem ([94ce294](https://github.com/msgbyte/tianji/commit/94ce294a8666811b5704f25bea328d54b69d0287))

### Document

* add api related documents ([850b642](https://github.com/msgbyte/tianji/commit/850b642cead45beacaefe4e4f1dc54a7a447c580))

## [1.21.1](https://github.com/msgbyte/tianji/compare/v1.21.0...v1.21.1) (2025-05-30)

### Features

* add a function which make sure we can get json response from LLM output even mode not support json mode ([411c285](https://github.com/msgbyte/tianji/commit/411c285b536a20e2c14d906356962c73c8fa8a67))
* add new routes and CommonPageEmpty component for various sections ([b5df979](https://github.com/msgbyte/tianji/commit/b5df979a92e8489bf15733b9c3882cce4c721dca))
* wrap Empty component in DelayRender for improved loading experience in CommonPageEmpty ([fedb7f9](https://github.com/msgbyte/tianji/commit/fedb7f922bf91e56d85130f4badbbdefb1d323c4))

## [1.21.0](https://github.com/msgbyte/tianji/compare/v1.20.10...v1.21.0) (2025-05-25)

### Features

* add api manage page allow description editing ([48f14b6](https://github.com/msgbyte/tianji/commit/48f14b6b8c970a8d3dd273d6f71528a983e53c69))
* add cron cron support to push monitor ([c23dff5](https://github.com/msgbyte/tianji/commit/c23dff5c699e92cfc5b74ccda5c7bd3816f83075))
* add MonitorPushStatus component to display push monitor status ([211a7fa](https://github.com/msgbyte/tianji/commit/211a7fab1a28a5f9e3fe33eb52086657e4265ffa))
* add more language example for push feature ([7a6fcbb](https://github.com/msgbyte/tianji/commit/7a6fcbbf057b8cee209176acda3cf1fd26ae322b))
* add Prometheus counters for cron jobs and message queue operations ([0afcb3d](https://github.com/msgbyte/tianji/commit/0afcb3d987b915b6a9e494ec8fc3464dc6ddc77f))
* add push monitor [#36](https://github.com/msgbyte/tianji/issues/36) ([2ca6487](https://github.com/msgbyte/tianji/commit/2ca6487f05e267308e8d34fb664765f9a99ea121))
* add push token regeneration feature to MonitorPush component ([3b07de2](https://github.com/msgbyte/tianji/commit/3b07de24821cb90ded72d4f09cac0be603adad14))
* integrate Stagewise toolbar for development environment ([303b799](https://github.com/msgbyte/tianji/commit/303b79941bdc1e6ea1e9c8263e55239464df975e))

### Document

* add document about push monitor ([8210f74](https://github.com/msgbyte/tianji/commit/8210f74e0127b08e9890ffe91a1fec4d86ea35e9))

### Others

* add badge SVG proxy in dev mode ([da0428c](https://github.com/msgbyte/tianji/commit/da0428c66b623863fd89acd64afd702e6eda919d))
* add global rules and project structure documentation for Tianji ([e5c427c](https://github.com/msgbyte/tianji/commit/e5c427c78f815e790544693861118a58daaeb23d))
* add more translation ([b21cd12](https://github.com/msgbyte/tianji/commit/b21cd123ccad10b52dee67acd7e78476e29ec1de))
* update translation ([69f1a19](https://github.com/msgbyte/tianji/commit/69f1a197adbe4e48942cf4cf0ef2008c201d5575))

## [1.20.10](https://github.com/msgbyte/tianji/compare/v1.20.9...v1.20.10) (2025-05-21)

### Features

* add AIGatewayCodeExampleBtn component and update ai proxy proxy configuration ([a921e24](https://github.com/msgbyte/tianji/commit/a921e24ad7b6d95cee3a79ff0dd36aea603d227b))
* add FeedState model and related functionality for managing feed states ([7347833](https://github.com/msgbyte/tianji/commit/734783310a61d2bc695dbd494ebe148e85575daf))
* add FeedStateList component to display and manage feed states in the feed view ([645e3b1](https://github.com/msgbyte/tianji/commit/645e3b1c88e5d6b515302071ac7cbb153be7d2b5))
* add insights events route ([51d949b](https://github.com/msgbyte/tianji/commit/51d949b4e31a4443fec7bfb85c3ecdabab78d4b8))
* add queryEvents function to handle website event queries ([db27f51](https://github.com/msgbyte/tianji/commit/db27f515042117293d1edc576875600835d68367))
* add state guide for feed api ([3050cfa](https://github.com/msgbyte/tianji/commit/3050cfa166a39b6ac9674a6949faaee0dc795622))
* update queryEvents to support cursor pagination and refactor related functions ([e698c61](https://github.com/msgbyte/tianji/commit/e698c616d4586385d526af9ddd19a9f51af665f2))

### Others

* move insight route ([78b21a4](https://github.com/msgbyte/tianji/commit/78b21a4d401e31310086bf828d1112f5b3f51d2c))
* rename insights.events => insights.eventNames ([0a5346d](https://github.com/msgbyte/tianji/commit/0a5346df3c5b083d7dcd6cb1582302c12ea0efa1))
* update dependencies and remove deprecated API files ([afad5f0](https://github.com/msgbyte/tianji/commit/afad5f08fc9086fff728567c66f2856a1ba6abe8))

## [1.20.9](https://github.com/msgbyte/tianji/compare/v1.20.8...v1.20.9) (2025-05-05)

### Bug Fixes

* fix website not support group filter problem ([4cc7fd0](https://github.com/msgbyte/tianji/commit/4cc7fd01309ed1079a7d9811f7e7cc3336b871f3))

### Others

* prevent access logs in test environment ([5fe4205](https://github.com/msgbyte/tianji/commit/5fe4205a44bce2e6c5fb17c27c911407c00ba246))

## [1.20.8](https://github.com/msgbyte/tianji/compare/v1.20.7...v1.20.8) (2025-05-02)

### Features

* add responsive testimonial grid and tweet card styles ([80cbf2b](https://github.com/msgbyte/tianji/commit/80cbf2bb4c26a3b223502bb33a2671d6ec7ffc8f))

### Document

* add robots.txt and LLM documentation files ([6da44ab](https://github.com/msgbyte/tianji/commit/6da44ab29cf29ae21fa9eb758fd3a48652761c9f))
* update documents ([4dc3d6d](https://github.com/msgbyte/tianji/commit/4dc3d6df1e5bf72bd39d11763ae5a20f89b872ba))

### Others

* improve insight debug logic ([31a9a33](https://github.com/msgbyte/tianji/commit/31a9a339cbb2030e44dc2d78f6fa1c8a3637a8b0))
* update version to 1.3.1 and improve event tracking error handling ([755dc8f](https://github.com/msgbyte/tianji/commit/755dc8fd78a4116f39fd673e1ec9e12437f95ae5))

## [1.20.7](https://github.com/msgbyte/tianji/compare/v1.20.6...v1.20.7) (2025-04-19)

### Features

* add real-time update feature for AI Gateway logs ([080123f](https://github.com/msgbyte/tianji/commit/080123f039fb43cdcb086195b5c32acad84d04df))

### Bug Fixes

* fix ai gateway chart label not correct issue ([a83ee66](https://github.com/msgbyte/tianji/commit/a83ee66874e67b7780ca8ed4fcbe61edd5b4564a))

## [1.20.6](https://github.com/msgbyte/tianji/compare/v1.20.5...v1.20.6) (2025-04-18)

### Bug Fixes

* restore timezone parameter in insights functions to improve date handling ([d3ee48e](https://github.com/msgbyte/tianji/commit/d3ee48e4c56171221f427f03003ebe1c0322f831))

## [1.20.5](https://github.com/msgbyte/tianji/compare/v1.20.4...v1.20.5) (2025-04-18)

### Bug Fixes

* fix a issue which maybe cause service crash ([08f3fe5](https://github.com/msgbyte/tianji/commit/08f3fe5705f9117d2907818cd6e798d36b140a47))
* make timezone parameter optional in date-related functions ([e05a289](https://github.com/msgbyte/tianji/commit/e05a289b37ebc86b532ebd13074ef93f7662d938))

### Others

* remove sitemap ([357c11c](https://github.com/msgbyte/tianji/commit/357c11c7af9ce76b909f7ac4cccdd55493324e27))
* update docusaurus dependencies to version 3.7.0 and enable sitemap configuration ([681d50c](https://github.com/msgbyte/tianji/commit/681d50ca86a54fc2a8b6ea718745502eb0774d27))

## [1.20.4](https://github.com/msgbyte/tianji/compare/v1.20.3...v1.20.4) (2025-04-17)

### Bug Fixes

* remove timezone parameter from insights functions as return date is already in user timezone ([7cf38f3](https://github.com/msgbyte/tianji/commit/7cf38f3613bb4afc6cd9b6580b9a2d054a26bfe3))

## [1.20.3](https://github.com/msgbyte/tianji/compare/v1.20.2...v1.20.3) (2025-04-17)

### Features

* enhance aiGateway to support additional model prefixes for deepseek variants ([5f2db80](https://github.com/msgbyte/tianji/commit/5f2db80c2e91f1d13994b1a364acf9d1d7152dd3))

## [1.20.2](https://github.com/msgbyte/tianji/compare/v1.20.1...v1.20.2) (2025-04-17)

### Bug Fixes

* fix some problem with user timezone handling in AIGateway overview and enhance SQL date formatting validation ([734f716](https://github.com/msgbyte/tianji/commit/734f7162a618a1ed18f3f14a3e463aa558b54fc1))

## [1.20.1](https://github.com/msgbyte/tianji/compare/v1.20.0...v1.20.1) (2025-04-17)

### Features

* enhance AI Gateway with model price name handling and support for new models in context window ([3771375](https://github.com/msgbyte/tianji/commit/3771375d6a8d5a80f461a17396aa957ef414bab5))

### Bug Fixes

* update email template and SMTP HTML to use 'Docs' instead of 'Documentation' ([041004c](https://github.com/msgbyte/tianji/commit/041004c369938483d0ed5a7be69649d2f42fb305))

### Document

* Add ClawCloud Run Button ([797c519](https://github.com/msgbyte/tianji/commit/797c519991cec001c8976f86183eadea5d114e38))

## [1.20.0](https://github.com/msgbyte/tianji/compare/v1.19.7...v1.20.0) (2025-04-14)

### Features

* add AI Gateway feature with CRUD operations and logs ([69d7878](https://github.com/msgbyte/tianji/commit/69d78787b237a873134a6f639a391222fa5417c7))
* add AI Gateway models, routes, and logging ([fe68b23](https://github.com/msgbyte/tianji/commit/fe68b2399a66f3a75377f0cbcf0705512ccde705))
* add AIGateway support to insights query schema ([e1eacea](https://github.com/msgbyte/tianji/commit/e1eaceadbf35edcd2e5cc1f09d17246de24242a3))
* add AIGateway-related translations and update chart colors ([b90d8ac](https://github.com/msgbyte/tianji/commit/b90d8ac24c11cbf63beed76edddcb14eaff9e78f))
* add blog section and two new blog posts ([88c689f](https://github.com/msgbyte/tianji/commit/88c689fe7ced5ee618c991202f50dd4a11bad0b9))
* add overview tab and insights support for AI Gateway ([ccf7bc7](https://github.com/msgbyte/tianji/commit/ccf7bc74176ae08e5b01a829862e67faca032601))
* add price tracking for AI Gateway logs ([96b8996](https://github.com/msgbyte/tianji/commit/96b89963d219f451d6ed968ac1452b209c2c945e))
* ai gateway add deepseek and openrouter support ([3a7dbc7](https://github.com/msgbyte/tianji/commit/3a7dbc71fdee11fe977919745a77f5e6b5864f29))

### Others

* consolidate SQL query building logic into base class ([77f046a](https://github.com/msgbyte/tianji/commit/77f046a8e3c5c8ac59030959f2c8afdabfeabee8))
* fix ci issue ([127f59a](https://github.com/msgbyte/tianji/commit/127f59aef7601803232af1159bf889b8e385b90f))
* improve token calculation with model fallback ([748be17](https://github.com/msgbyte/tianji/commit/748be176f12cab08f1186eb5e06e25258f22222e))
* replace dropdown with select component for date range ([55c303d](https://github.com/msgbyte/tianji/commit/55c303df10f4cb33306d1b1784e046bb8d6a8bc4))
* update translation ([d1dfbbb](https://github.com/msgbyte/tianji/commit/d1dfbbb6d4db7faa337b7846bb581f99184993c9))

## [1.19.7](https://github.com/msgbyte/tianji/compare/v1.19.6...v1.19.7) (2025-04-06)

### Features

* add workspace invitation which allow user invite non-register user [#180](https://github.com/msgbyte/tianji/issues/180) ([32d52ae](https://github.com/msgbyte/tianji/commit/32d52aef5b23af3460e2e4d8f42b9b994669c02f))

### Document

* add MCP integration and environment variable documentation ([aefb090](https://github.com/msgbyte/tianji/commit/aefb0900703053920877fe266004425fd22fe584))
* add social icons ([a9bee2a](https://github.com/msgbyte/tianji/commit/a9bee2a3e9399775be3f74a472c96da7ff1893e7))

### Others

* enhance email template and consolidate SMTP logic ([b2a384c](https://github.com/msgbyte/tianji/commit/b2a384cf0d8c23743e56c5c2ee75d56c81e4d35f))

## [1.19.6](https://github.com/msgbyte/tianji/compare/v1.19.5...v1.19.6) (2025-04-01)

### Features

* add value formatter and filesize for application compare ([17ebf2e](https://github.com/msgbyte/tianji/commit/17ebf2e6bf402fc39d89a4ee5feb2c5975242791))
* create tianji mcp server ([36aaabc](https://github.com/msgbyte/tianji/commit/36aaabc91e1dbfe5ee6da1cb465a2647e99d19be))
* insight add line chart type ([bf0022d](https://github.com/msgbyte/tianji/commit/bf0022d7438646ec913c69dbdf65839df47f8f7b))

### Bug Fixes

* fix user api key not increment problem ([cf2b454](https://github.com/msgbyte/tianji/commit/cf2b454146651a5683306e12c50d350d923fdb78))

### Document

* add dark-brand ([a2c5c98](https://github.com/msgbyte/tianji/commit/a2c5c98d093f15fcf1d7a4ed606547678fc0ffa1))
* fix typo ([34d863e](https://github.com/msgbyte/tianji/commit/34d863efa8814ee0919d0f24fa33f4cf26ba18e8))

### Others

* remove inappropriate translations ([0ffb3be](https://github.com/msgbyte/tianji/commit/0ffb3beb5ef3787b2a2f4a7f069d0676fb8f79cd))

## [1.19.5](https://github.com/msgbyte/tianji/compare/v1.19.4...v1.19.5) (2025-03-28)

### Others

* rollback pnpm version to 9.x because of isolated_vm [#181](https://github.com/msgbyte/tianji/issues/181) ([15d575d](https://github.com/msgbyte/tianji/commit/15d575d954627fbd4ea1b626c837cdff8962ab60))

## [1.19.4](https://github.com/msgbyte/tianji/compare/v1.19.3...v1.19.4) (2025-03-27)

### Features

* add line chart type support and adjust fill opacity ([0724d8c](https://github.com/msgbyte/tianji/commit/0724d8c6a4ef5d3946400758e083ee4887d7ab7e))
* add react native sdk initApplication function and handle session version ([fdf4a05](https://github.com/msgbyte/tianji/commit/fdf4a05ff6ef432a2e9988626167e1e3a057cf08))
* refactor insights SQL builders and update related tests ([ccf93cb](https://github.com/msgbyte/tianji/commit/ccf93cb6c6ee53d5ec9e0979310bef0f479b12f8))

### Others

* rerun all translation with 4o ([e60136e](https://github.com/msgbyte/tianji/commit/e60136e0a0aee3f16e9d05306d178ef775e8e020))
* update pnpm version to 10.6.5 ([176f4ed](https://github.com/msgbyte/tianji/commit/176f4edb05ae40f015d1d91db2eda9bb90a8ca24))

## [1.19.3](https://github.com/msgbyte/tianji/compare/v1.19.2...v1.19.3) (2025-03-25)

### Features

* add diff view in application compare chart ([c49152a](https://github.com/msgbyte/tianji/commit/c49152a1bc5bb895ccd76a4bd4db1231a75bc19e))
* add http status code field which can treat other status code as normal. [#173](https://github.com/msgbyte/tianji/issues/173) ([1cacdeb](https://github.com/msgbyte/tianji/commit/1cacdeb7ec2b2d69f4b9f0fe69737c2a6e1451aa))

### Document

* add environment document ([db654d3](https://github.com/msgbyte/tianji/commit/db654d32bb5f594d4ba15caaa24e73d49d669825))

### Others

* update translation ([6d8b12e](https://github.com/msgbyte/tianji/commit/6d8b12e35e0426575be3f1057d9cbc403bad7028))

## [1.19.2](https://github.com/msgbyte/tianji/compare/v1.19.1...v1.19.2) (2025-03-23)

### Features

* add app store search and picker ([331153d](https://github.com/msgbyte/tianji/commit/331153df25889802975d6836f8bf67e28e10a400))
* add application compare feature ([0f8a672](https://github.com/msgbyte/tianji/commit/0f8a6729048e2d93bb8cee076387609c929d48e2))
* add store info history ([0473ba5](https://github.com/msgbyte/tianji/commit/0473ba5f2178af9a1c7a6752810e6dc288f869b8))
* store detail tab add history chart ([63e9588](https://github.com/msgbyte/tianji/commit/63e9588aa5e29a2541ba45b6a3c07ba2afa2201d))

### Others

* improve style ([8484e25](https://github.com/msgbyte/tianji/commit/8484e25e39509ed665200305c35763467b3ebe5b))
* update translation ([6a21965](https://github.com/msgbyte/tianji/commit/6a21965f3d5bec5e66dab0e32716ee59809d9f09))
* upgrade node version to 22.14.0, [#132](https://github.com/msgbyte/tianji/issues/132) ([48280c5](https://github.com/msgbyte/tianji/commit/48280c596d8dc9c6b1fbb22820e9a1075a7e7830))

## [1.19.1](https://github.com/msgbyte/tianji/compare/v1.19.0...v1.19.1) (2025-03-22)

### Bug Fixes

* fix a bug which will clause run custom code error ([9a132d9](https://github.com/msgbyte/tianji/commit/9a132d93a4584db2e441a2bd68b64c5b86de1b75))

### Document

* add more language document for application tracking ([4ed139f](https://github.com/msgbyte/tianji/commit/4ed139fb9315a47288417914aa752842eba629b3))
* update translation modify files in README.md ([3310a1c](https://github.com/msgbyte/tianji/commit/3310a1c00264067a7e62c7c67cc177c8e41f3a0c))

### Others

* add more docker ignore claim to reduce docker image size ([aa29d18](https://github.com/msgbyte/tianji/commit/aa29d18d910a3a45ecfddde71838db771dd700f6))

## [1.19.0](https://github.com/msgbyte/tianji/compare/v1.18.22...v1.19.0) (2025-03-22)

### Features

* add application entry ([b9d6e4a](https://github.com/msgbyte/tianji/commit/b9d6e4a7745abcb059f9d6e9c1701d0855a86f8b))
* add application event router ([da83fa9](https://github.com/msgbyte/tianji/commit/da83fa9d28d4d6d9c4ccd80b71568feed7b6e24b))
* add application models ([90c72a9](https://github.com/msgbyte/tianji/commit/90c72a9d321c0df9c057b5da529bd598150df76d))
* add application page add/edit and appinfo scraper logic ([b114aaf](https://github.com/msgbyte/tianji/commit/b114aafbf93a6fbb7531fb3391da9114e11edcbf))
* add application screen name support ([5e7c499](https://github.com/msgbyte/tianji/commit/5e7c4990f85fe2c644f0e3fef47fd9deb7c27bc2))
* add auto jump for application route ([01521e7](https://github.com/msgbyte/tianji/commit/01521e73097918e5a84757fc7ac9ed01bc86d0ef))
* add avgEventsPerSession and avgScreensPerSession ([87e5e19](https://github.com/msgbyte/tianji/commit/87e5e191f7582305998b73e140e39aff8c098da9))
* add charts for app stats ([a767aca](https://github.com/msgbyte/tianji/commit/a767acacab0d77797739020147289f444ca447e6))
* add daily cronjob dailyUpdateApplicationStoreInfo ([0fbf456](https://github.com/msgbyte/tianji/commit/0fbf456be5de70c3b716d6afc94198db8d755527))
* add delete feature in application page ([824dedd](https://github.com/msgbyte/tianji/commit/824deddc4102129be42d97a1efb2cf1dfe45ad3a))
* add read more component and apply in application description ([10fb73a](https://github.com/msgbyte/tianji/commit/10fb73a304c16c1af9822633cb2a88f36f1dd766))
* add screen view event reporting and update version ([83cb111](https://github.com/msgbyte/tianji/commit/83cb111617382ea8ad6458239c7b320f10ce2da6))
* add StatCard component and integrate avg time metric ([f99a6e0](https://github.com/msgbyte/tianji/commit/f99a6e0dcc4287d2f5f7ea94420f0f74729a8f3c))
* add vm2 sandbox support as vm runtime backup ([6928103](https://github.com/msgbyte/tianji/commit/69281039972301ad4c1b7f5a0916a8dab9c636b9))
* allow change role in member table if people is workspace owner [#170](https://github.com/msgbyte/tianji/issues/170) ([d94a9bd](https://github.com/msgbyte/tianji/commit/d94a9bd5a0c120e8dc8675db98ea3c8df1622f2d))

### Bug Fixes

* [#172](https://github.com/msgbyte/tianji/issues/172) fix import issue ([be1e5fb](https://github.com/msgbyte/tianji/commit/be1e5fbf61a58f17859a1030a19bbf11be4645cc))

### Document

* add new documentation for application tracking SDK ([7374542](https://github.com/msgbyte/tianji/commit/7374542a44b0caaeff593b9a84b9a5d557674c89))
* add yandex verify ([fa0d2da](https://github.com/msgbyte/tianji/commit/fa0d2dabf7fea18118c83d0fc54f141447e162d9))

### Others

* add app card component ([d34da88](https://github.com/msgbyte/tianji/commit/d34da88cb6c27714d05c09c1a64054f64809f9cc))
* add application tracking things ([9ff4dc6](https://github.com/msgbyte/tianji/commit/9ff4dc663da112c0f13d5ce44242af9229043561))
* add count sum in worker ([4672795](https://github.com/msgbyte/tianji/commit/4672795b9708ca4b494c425bdd720ebf4bb03661))
* add member role translation ([512cbbf](https://github.com/msgbyte/tianji/commit/512cbbf0e8694a91d06cd8135c6c2ecf846313ee))
* add no store info tip and update translation ([3a50ce5](https://github.com/msgbyte/tianji/commit/3a50ce56daee31dc676f69b117e9af0d74132976))
* drop expo example support ([2bcec9e](https://github.com/msgbyte/tianji/commit/2bcec9ee2fca35fd8386bbf7127bfce690c335dc))
* fix ci problem ([5a09aff](https://github.com/msgbyte/tianji/commit/5a09affb4752b0009ba6047f9341eccbd04e5a63))
* improve style and make those things more better ([604d53c](https://github.com/msgbyte/tianji/commit/604d53ceb9a60177c97c4fb7da2cdfea311a0cc1))
* init expo repo which as example for react native sdk ([0e42057](https://github.com/msgbyte/tianji/commit/0e42057aeda1cca54766ce21d9325af3494b43a0))
* integrate nativewind for styling and update configs ([2d0a225](https://github.com/msgbyte/tianji/commit/2d0a2252b06925534dd8774a5d3c5c28e5dc7aa9))
* move example to example/web ([45250ed](https://github.com/msgbyte/tianji/commit/45250ed748880c58478cfb28767019efc6ab951e))
* refactor cronjob tasks and move to independent file ([9be0e28](https://github.com/msgbyte/tianji/commit/9be0e28085cea9a1dfa45e4ec83b626f6aba6ec3))
* reorder components and update styles ([bd4e737](https://github.com/msgbyte/tianji/commit/bd4e73775d4f09ad69335e74bb4b5fce4a174272))
* reorganize overview tab and detail card layout ([7cef811](https://github.com/msgbyte/tianji/commit/7cef81194337e8183caad633c55230917dc98d32))
* update translation ([0d409be](https://github.com/msgbyte/tianji/commit/0d409be7b7c26656366f149bfbd5c01d177b33eb))

## [1.18.22](https://github.com/msgbyte/tianji/compare/v1.18.21...v1.18.22) (2025-03-15)

### Features

* add stack chart type ([5a5579a](https://github.com/msgbyte/tianji/commit/5a5579a036cef1733d992b542c7ae728fcf42f42))
* add survey break down filter render chart and table view ([e13256e](https://github.com/msgbyte/tianji/commit/e13256e6cdcde455e992905011de2693483fcca9))
* insight survey add groups support ([0288735](https://github.com/msgbyte/tianji/commit/028873523f487e21215d5d7e6388f8339f473bc8))
* insight website add groups support ([54d2678](https://github.com/msgbyte/tianji/commit/54d267887f06993d8cefa1bfdc96f6f7eab52402))

### Others

* add more chart color ([ca0601d](https://github.com/msgbyte/tianji/commit/ca0601d1e49c7602a23f310be0b32c98feb8a054))
* fix ci problem ([78a2a79](https://github.com/msgbyte/tianji/commit/78a2a793ee43fce7fbd6f45f2d8b13a0930d18a5))
* insight add types and survey params ([446b19a](https://github.com/msgbyte/tianji/commit/446b19a8ca9d37c28c7ad97e4f20ba2956be9600))
* refactor survey sql place ([099214c](https://github.com/msgbyte/tianji/commit/099214ca6f0b41cfe126ab89ac8ababccb1f391c))
* release insight route for non-dev environment ([8bdff74](https://github.com/msgbyte/tianji/commit/8bdff74ba6312461c4b3b57da10e5145c0b2fcab))
* rollback react package version ([d69b484](https://github.com/msgbyte/tianji/commit/d69b484fae322523c2183fd319aaef23cc85930c))
* update minute logic, will auto switch date unit after switch ([965e502](https://github.com/msgbyte/tianji/commit/965e50229a58ec37860483c8ed87b7d5dbf8f9ea))

## [1.18.21](https://github.com/msgbyte/tianji/compare/v1.18.20...v1.18.21) (2025-03-13)

### Others

* improve write logic, update database when openai return response ([0d31c07](https://github.com/msgbyte/tianji/commit/0d31c074fa29d42de3f63d28656dac5de7988a5c))
* update end at time for ai task to let has more range ([2849048](https://github.com/msgbyte/tianji/commit/2849048ec4d31b94b082609f2232f91a71c55a3d))

## [1.18.20](https://github.com/msgbyte/tianji/compare/v1.18.19...v1.18.20) (2025-03-12)

### Others

* change daily work cronjob time ([a288245](https://github.com/msgbyte/tianji/commit/a288245cf306fb5fd523b659b611cb0b5b1499a8))
* implement common filter query operator for insights model ([d972924](https://github.com/msgbyte/tianji/commit/d9729241e080e42e7c922ae15408ba3713b225b4))
* update dependencies and package versions ([3762281](https://github.com/msgbyte/tianji/commit/3762281f601ab5517d3411da81b6238a98d7a4c8))

## [1.18.19](https://github.com/msgbyte/tianji/compare/v1.18.18...v1.18.19) (2025-03-11)

### Others

* update default mode because of different performance in data analysis ([2b23ec9](https://github.com/msgbyte/tianji/commit/2b23ec95dd43b01e4d461548dc0685d797e7db20))

## [1.18.18](https://github.com/msgbyte/tianji/compare/v1.18.17...v1.18.18) (2025-03-11)

### Others

* update top p and temperature ([1f850b6](https://github.com/msgbyte/tianji/commit/1f850b6a5b22307ff89ba70e6f1236c241d28fa5))

## [1.18.17](https://github.com/msgbyte/tianji/compare/v1.18.16...v1.18.17) (2025-03-11)

### Others

* fix ci problem ([6fd40b0](https://github.com/msgbyte/tianji/commit/6fd40b0255ef727a06cc9f3fd22462892c10193c))

## [1.18.16](https://github.com/msgbyte/tianji/compare/v1.18.15...v1.18.16) (2025-03-11)

### Others

* update lock file ([d3b1adc](https://github.com/msgbyte/tianji/commit/d3b1adcde0eb2f9a37f61c416f4bbdc19365c408))

## [1.18.15](https://github.com/msgbyte/tianji/compare/v1.18.14...v1.18.15) (2025-03-11)

### Others

* rebuild ai classify prompt which will have more better performance ([c9f2a8e](https://github.com/msgbyte/tianji/commit/c9f2a8ebdf8d13b487a140d22bb63da5fafdcee7))

## [1.18.14](https://github.com/msgbyte/tianji/compare/v1.18.13...v1.18.14) (2025-03-11)

### Features

* add country translation ([4a183a6](https://github.com/msgbyte/tianji/commit/4a183a685bdf443e07635f4f228f5d809f5f49a0))
* add custom date picker in insight feature ([c0aa47b](https://github.com/msgbyte/tianji/commit/c0aa47b671758765456d68dad01f3cc8f83bb885))
* add openapi for ai route and update openai schema ([da1cb8c](https://github.com/msgbyte/tianji/commit/da1cb8ce1ebfbf8de1be341582ec05205f204ca0))
* add SearchLoadingView which improve insight display ([30fd3bf](https://github.com/msgbyte/tianji/commit/30fd3bfe4335170eb13cd71df83d2474a88dc48b))
* add worker which can trigger ai task in survey daily ([44f8507](https://github.com/msgbyte/tianji/commit/44f8507ab42516dbcfa8732393cd1a2d7ae25dfb))
* insight add survey support ([8542d48](https://github.com/msgbyte/tianji/commit/8542d48e8139435b0b71321f5aa147a768587bfe))

### Bug Fixes

* fix filter operator in date type ([13f96a8](https://github.com/msgbyte/tianji/commit/13f96a8ffb0095957ece18d7e1e4dd561eef1474))

### Document

* update openapi schema ([9642142](https://github.com/msgbyte/tianji/commit/96421423c564d17a967c933d1d7152360394ac13))

### Others

* add insight type support in code logic ([1f2af9b](https://github.com/msgbyte/tianji/commit/1f2af9b044645639dc23b3aabed180c8e0a9f14a))
* create daily-ai-trigger project ([f20e149](https://github.com/msgbyte/tianji/commit/f20e14988912b0087aceb3e853aa29d79630b652))
* improve display of count ([e26de44](https://github.com/msgbyte/tianji/commit/e26de446d787d2bdd4c64f74b3a71ab354d02d05))
* improve insight chart render main block display ([62ef469](https://github.com/msgbyte/tianji/commit/62ef469812749030218a4dfd3e4e0211d3eaee5f))
* rebuild insight related logic place folder ([4951410](https://github.com/msgbyte/tianji/commit/49514104c31ac766a91bdeb41723a1038e627356))
* update monitor clear day, make sure its can always large than 1 month ([e048157](https://github.com/msgbyte/tianji/commit/e04815798849ddd59f547e6ab276a344105ca860))

## [1.18.13](https://github.com/msgbyte/tianji/compare/v1.18.12...v1.18.13) (2025-03-09)

### Features

* add run task record ([48383db](https://github.com/msgbyte/tianji/commit/48383db76db4ad1b45aff6d0ddf41b1dd7677c99))

### Others

* change survey preview date range from 7 days to 14 days ([99a9f3b](https://github.com/msgbyte/tianji/commit/99a9f3b4765216a02e3c5406d0bba6feb53b0d4c))

## [1.18.12](https://github.com/msgbyte/tianji/compare/v1.18.11...v1.18.12) (2025-03-07)

### Features

* add survey ai translation ([476259c](https://github.com/msgbyte/tianji/commit/476259ce5ce071717170ebe02ca4f9c2758703bf))
* add workspace task model ([94a4943](https://github.com/msgbyte/tianji/commit/94a49436e3a194a29f3a073397651c4347a4ee57))

### Bug Fixes

* add scrollview in status page ([1f5280e](https://github.com/msgbyte/tianji/commit/1f5280e39d59f091a14ea5db1bacd8d595b53c4a))

### Document

* add Troubleshooting section in server status page ([9b2b881](https://github.com/msgbyte/tianji/commit/9b2b8812726f53d7cdb98dfbe5fb88b3a42a76f4))

### Others

* add ai classify worker batch log ([668705c](https://github.com/msgbyte/tianji/commit/668705c9de52d5803eb36887c0f1ce7b3a009c8c))
* add key to force refresh table component ([ae095fb](https://github.com/msgbyte/tianji/commit/ae095fbf6768806f9acb018bb321e383d8a4bf01))
* change default language strategy to user ([7b2b202](https://github.com/msgbyte/tianji/commit/7b2b2028fe6225866ac820951061752ba71a2b30))
* fix ci problem ([3f8e17d](https://github.com/msgbyte/tianji/commit/3f8e17dcde44ce27caf145916cb90bdd739453e3))
* move insight button into dev stage ([96faa81](https://github.com/msgbyte/tianji/commit/96faa81a3daf9d944e7d12b90c53c07c308c7678))
* refacyor survey ai button modal ([9a24eca](https://github.com/msgbyte/tianji/commit/9a24ecacb18e70f39775f693f7e15469eed84218))

## [1.18.11](https://github.com/msgbyte/tianji/compare/v1.18.10...v1.18.11) (2025-02-19)

### Others

* improve tokenizer calc, replace with number rather than calc because of high cpu usage ([3ba7ca2](https://github.com/msgbyte/tianji/commit/3ba7ca2b537a7eef5b01b9553897fc0e1410ca76))

## [1.18.10](https://github.com/msgbyte/tianji/compare/v1.18.7...v1.18.10) (2025-02-18)

### Features

* migrate ai survey task from promise to MQ ([e79ad8f](https://github.com/msgbyte/tianji/commit/e79ad8fe4b966d69956fea01c3474fe6b347ba52))

### Bug Fixes

* fix a not accept language problem(some ts issue before) ([b38310e](https://github.com/msgbyte/tianji/commit/b38310eb1c2b9811c93567989aa15fcc7acb9afd))
* hotfix some header not have language header issue ([8959ddc](https://github.com/msgbyte/tianji/commit/8959ddcc4bb70bb8d921bc27a5db3810d2daeecc))

### Others

* release v1.18.8 ([b838c4d](https://github.com/msgbyte/tianji/commit/b838c4dc055cd2109ee08476f1afec5bc94d38e3))
* release v1.18.9 ([ab90204](https://github.com/msgbyte/tianji/commit/ab90204344f4336c14669e856c37267a94164bed))
* update survey date picker logic ([a235289](https://github.com/msgbyte/tianji/commit/a2352896dc1806ce6e208b27ca150a3f3758dcf7))
* use or to filter suggestion category ([c0995bc](https://github.com/msgbyte/tianji/commit/c0995bcb313d72429bc5fe1a7eeea6fde6ef5764))

## [1.18.9](https://github.com/msgbyte/tianji/compare/v1.18.8...v1.18.9) (2025-02-18)

### Bug Fixes

* fix a not accept language problem(some ts issue before) ([5f53736](https://github.com/msgbyte/tianji/commit/5f53736fa1e0716ef04e50c95900087b9da78c9a))

## [1.18.8](https://github.com/msgbyte/tianji/compare/v1.18.7...v1.18.8) (2025-02-18)

### Bug Fixes

* hotfix some header not have language header issue ([da24e65](https://github.com/msgbyte/tianji/commit/da24e653aeb7edef907a7dfa9b997e7b198fa83a))

## [1.18.7](https://github.com/msgbyte/tianji/compare/v1.18.6...v1.18.7) (2025-02-17)

### Features

* add group analyze and ai debug ([971427f](https://github.com/msgbyte/tianji/commit/971427f22f2ee85cec8007a0f4bc3539df1aef11))
* add user language support in ai category classify ([ab4342b](https://github.com/msgbyte/tianji/commit/ab4342b2a2af83581f0a910671df3725db0b3315))

## [1.18.6](https://github.com/msgbyte/tianji/compare/v1.18.5...v1.18.6) (2025-02-16)

### Features

* add click to view ai category feature ([b72643a](https://github.com/msgbyte/tianji/commit/b72643a5372f29ba8aa0c9964efc6d54379c7c10))
* add env DISABLE_ACCESS_LOGS and DEBUG_AI_FEATURE ([4795b3d](https://github.com/msgbyte/tianji/commit/4795b3dc3583b671ddf0e24f9ca7afb76ac04c5b))
* add more run strategy and improve ui style ([fd1e5cb](https://github.com/msgbyte/tianji/commit/fd1e5cb46e39c114fb66db410f403ec15c36d79d))

### Bug Fixes

* [#158](https://github.com/msgbyte/tianji/issues/158) fix typo ([8819af4](https://github.com/msgbyte/tianji/commit/8819af4db1cc01727ddfe4cf41a48390b1634889))

### Document

* add telemetry report claim ([fc67dba](https://github.com/msgbyte/tianji/commit/fc67dbaef82121a58a02c14f1787cc7f3f1b9cd5))
* improve display for website carousel, which will let image can be selected ([99b4140](https://github.com/msgbyte/tianji/commit/99b41408ce1b41f4229ee689def60d99189aa8e9))

### Others

* add filter query in survey result ([fff7346](https://github.com/msgbyte/tianji/commit/fff7346d3cd5da284691e89cc145863ec4d8d482))
* update columns logic ([d6af45e](https://github.com/msgbyte/tianji/commit/d6af45e2b200a9cb2b188bb92843a8751a2ff626))
* update translation ([dc41557](https://github.com/msgbyte/tianji/commit/dc415578ebdc363a7825a4262bf93ae2479b4d31))
* update translation ([f627b31](https://github.com/msgbyte/tianji/commit/f627b31a71149eae27f8fda17d608a86fe3f1709))

## [1.18.5](https://github.com/msgbyte/tianji/compare/v1.18.4...v1.18.5) (2025-02-11)

### Others

* add more timezone related things ([ca37ea1](https://github.com/msgbyte/tianji/commit/ca37ea16eaa5e98e29e3727859e9409fcbaacca6))
* clear result text after re-run ([a63240a](https://github.com/msgbyte/tianji/commit/a63240accf6c5094bc6fd2f3e9f94697c4595c23))
* merge category result after parsed ([8d6ab5c](https://github.com/msgbyte/tianji/commit/8d6ab5c44870ccf3aa19bfcd9989bb66e62d9275))

## [1.18.4](https://github.com/msgbyte/tianji/compare/v1.18.3...v1.18.4) (2025-02-10)

### Bug Fixes

* fxi import problem in server side in 1.18.3 ([d59fe7b](https://github.com/msgbyte/tianji/commit/d59fe7b03a41924f823418508f0385b6323c9338))

## [1.18.3](https://github.com/msgbyte/tianji/compare/v1.18.2...v1.18.3) (2025-02-10)

### Bug Fixes

* fix timezone issue in server side which in different server ([e3d6828](https://github.com/msgbyte/tianji/commit/e3d682889cb9011970687e6b6649eee33bee9bf8))

### Others

* fix ci problem ([73687a6](https://github.com/msgbyte/tianji/commit/73687a6163a178f1249963ca3da88b4572b3e997))

## [1.18.2](https://github.com/msgbyte/tianji/compare/v1.18.1...v1.18.2) (2025-02-09)

### Features

* add checkbox ui ([9068935](https://github.com/msgbyte/tianji/commit/9068935e3bfab5fc375d8c75a1c66fa8ec3babf4))
* add classify survey feature ([4c37eab](https://github.com/msgbyte/tianji/commit/4c37eab57ab43086c0c12ca5454469202b484cbd))
* add credit cost and check in ai ask route ([6c8e49b](https://github.com/msgbyte/tianji/commit/6c8e49b43011991f6318ff2d979bfc13da0646ab))
* add image url render ([b84b840](https://github.com/msgbyte/tianji/commit/b84b840a38fa331a4b86fb05883a6fe097aa9977))
* add SurveyCategoryChart ([ba281ac](https://github.com/msgbyte/tianji/commit/ba281ac0f66ff756ad72c0f8d8e9c211f85cf2f5))

### Bug Fixes

* fix app review pool not enough problem ([cd29f86](https://github.com/msgbyte/tianji/commit/cd29f8631878023f7f363ff85e07bf65a6594a14))
* fix survey stat timezone not correct problem ([a5c7998](https://github.com/msgbyte/tianji/commit/a5c7998cf1431086336d231b6aa2b5d9b40544d7))

### Others

* add global config local storage cache ([cc532bb](https://github.com/msgbyte/tianji/commit/cc532bb381f5cc766616f2a12165f01a56d69f1b))
* add translation ([170b406](https://github.com/msgbyte/tianji/commit/170b40647c0f53216ebea85f18d891eca9b6b9a3))
* extract DatePicker component ([ead62eb](https://github.com/msgbyte/tianji/commit/ead62eb77f985bcf5f7fe90bfe2aee3783246d2b))
* survey download btn should export all necessary field ([b936421](https://github.com/msgbyte/tianji/commit/b936421fa7138b437efa9cc5a835cf3a59ba6be5))

## [1.18.1](https://github.com/msgbyte/tianji/compare/v1.18.0...v1.18.1) (2025-02-02)

### Others

* upgrade isolated-vm version ([ec3e9a3](https://github.com/msgbyte/tianji/commit/ec3e9a3daeae4d7ed30742110b5424dce26d593a))
* upgrade zeromq version from 6.0.4 -> 6.3.0 ([f5e5e5c](https://github.com/msgbyte/tianji/commit/f5e5e5c46b46a3bc219ef72db4ef8ef2d318cd75))

## [1.18.0](https://github.com/msgbyte/tianji/compare/v1.17.6...v1.18.0) (2025-02-02)

### Features

* add ai tool getSurveyByDateRange ([a27ef8f](https://github.com/msgbyte/tianji/commit/a27ef8f38c3518748569befe655a4d88eadca775))
* add aiToolsSelection which can easy to pick tools ([eec23ec](https://github.com/msgbyte/tianji/commit/eec23ec506dc5cb1498a91c81090f4ebcc2dfb18))
* add busy check ([fea436a](https://github.com/msgbyte/tianji/commit/fea436ac07e61e92c3369af04a8d499e4c7ddd2d))
* add date picker ([c83c43d](https://github.com/msgbyte/tianji/commit/c83c43d73fd316cf1002324eb0e35561be31ab4d))
* add date unit support ([453c8f2](https://github.com/msgbyte/tianji/commit/453c8f25e2e907b312d7818a15ed45e120c16314))
* add event calc math method: by session ([8c6bb24](https://github.com/msgbyte/tianji/commit/8c6bb24143566fcc7c2ea222831fdeac8cd7813f))
* add hover state of metrics block ([4d5b098](https://github.com/msgbyte/tianji/commit/4d5b098f9f41a5af5c14f9143f732a937e6814de))
* add insights chart render and backend fetch ([343e2b3](https://github.com/msgbyte/tianji/commit/343e2b353e855843b58e70d1097c13b146f608ec))
* add insights in chart ([1c777b7](https://github.com/msgbyte/tianji/commit/1c777b754bf4ef6b946ee1e30137d7b2389e6806))
* add new entry for website insights ([82972f5](https://github.com/msgbyte/tianji/commit/82972f51c5472ccfd1092e7c8727eca991c7983a))
* add resizable panel ([61af19b](https://github.com/msgbyte/tianji/commit/61af19bba5fbed4313e859598d73f3a99c95f051))
* add survey detail sheet panel ([5752762](https://github.com/msgbyte/tianji/commit/57527625cbbfa2089648f0748327e6716813b1f1))
* add survey prompt, credit calc logic and context ([a651f5d](https://github.com/msgbyte/tianji/commit/a651f5d977a7a87ecd642b8435f9aa2462cb0c32))
* add table pinning ([572e551](https://github.com/msgbyte/tianji/commit/572e5512b55ab75f3391233a62fb2ecaab1b2234))
* add table view for insights ([05a7def](https://github.com/msgbyte/tianji/commit/05a7def550b587b831235a2e95ca07a52dc8983e))
* add tianji app reviewer ([5da38b4](https://github.com/msgbyte/tianji/commit/5da38b4c0f49f7619495f4cd12c917e232717f49))
* add useAIStoreContext which allow change current page ai store context ([f70dde0](https://github.com/msgbyte/tianji/commit/f70dde03bcc3d12468c19ae3913c9b867a9b4980))
* insights add filter logic ([c1b0812](https://github.com/msgbyte/tianji/commit/c1b081282cce8da41942089099e2941523042eb1))
* metrics add delete item support ([9779885](https://github.com/msgbyte/tianji/commit/9779885720e479d0a077b95c00ef4bc8739d6315))

### Bug Fixes

* [#146](https://github.com/msgbyte/tianji/issues/146) fix typo ([e1ed6e3](https://github.com/msgbyte/tianji/commit/e1ed6e35633cd5aef1705a11f0d6aeb918c316ef))
* fix a issue which will make openai key is required(original should be optional) [#139](https://github.com/msgbyte/tianji/issues/139) ([f0fba13](https://github.com/msgbyte/tianji/commit/f0fba13179115aa68741ab8b66f7375f1cab2aac))
* fix session data can not save problem ([9405884](https://github.com/msgbyte/tianji/commit/94058840df5626e94cf7a53a793c060ad664b160))

### Document

* add event track documents ([d815adf](https://github.com/msgbyte/tianji/commit/d815adfa720c30d3340a5e790519b55c2ed80ac1))
* add interactive hover button in get start button ([a40fe6e](https://github.com/msgbyte/tianji/commit/a40fe6e646d009506ae5674e09cd2393e0c1b88d))
* add tweet card in website ([f6e443f](https://github.com/msgbyte/tianji/commit/f6e443fae504d1c34befffdc12648a59e374a300))
* upgrade docusaurus-i18n and update website translation ([892e650](https://github.com/msgbyte/tianji/commit/892e650d3ce0bba2ac5f365e474d39b8176b3e80))

### Others

* add empty state for chart render component ([208daf0](https://github.com/msgbyte/tianji/commit/208daf0259afcd1296adec23e19f32a43ebda5c1))
* add identify in example repo ([a61d28f](https://github.com/msgbyte/tianji/commit/a61d28fda55941f6e178548d209dcd10e6128eb3))
* add metrics block no content tip ([0d91bad](https://github.com/msgbyte/tianji/commit/0d91badc41830c7921d8314c5bbcbe1cece01ea5))
* add more example playground events ([ce70092](https://github.com/msgbyte/tianji/commit/ce7009248a97287d8b567f15465607ae68dc5cae))
* add null ip process ([59eac90](https://github.com/msgbyte/tianji/commit/59eac903c3e09f4b09d807f21bab471055d16f6c))
* add openai tool choose support ([a0d170d](https://github.com/msgbyte/tianji/commit/a0d170de36eae12fec32faa4db444e575de9f737))
* add openapi sdk options ([ea4b04c](https://github.com/msgbyte/tianji/commit/ea4b04cd6eab399a7ba4fe4264b94e8ef7338b5f))
* add optional in channel ([ae4c2bb](https://github.com/msgbyte/tianji/commit/ae4c2bb89bae03389441fa07cfddb4943be3c16e))
* add type support for ai store context ([b548341](https://github.com/msgbyte/tianji/commit/b548341dccf9c8ba431f0b7a4eea73d56729032b))
* disable ai feature if not enable ai feature in server ([6a5753e](https://github.com/msgbyte/tianji/commit/6a5753e487547efc637e5e47ddaac4c0088b2756))
* example repo add send tianji report support ([d8e642b](https://github.com/msgbyte/tianji/commit/d8e642be953d8cd02199d91d73d76308e49a5b9d))
* fix ci problem ([2f70afd](https://github.com/msgbyte/tianji/commit/2f70afdeaa20b2ad9ea1be4ed9ce9774bf61f49e))
* fix ci problem ([2e47cc4](https://github.com/msgbyte/tianji/commit/2e47cc44d3e94970d082613c3d5699d25c71daa5))
* fix ci problem ([f9bda19](https://github.com/msgbyte/tianji/commit/f9bda19d828e517ca4be7503c686f1ac27745019))
* fix datatable component array keys problem ([be90c3d](https://github.com/msgbyte/tianji/commit/be90c3d5e2f21e61674a8bacff2b3e7df11e580a))
* fix trpc-to-openapi use incorrect middleware problem ([b91cb44](https://github.com/msgbyte/tianji/commit/b91cb4458f3e4ddccdb05ba981f8e263c7221071))
* improve insights style ([ff5b777](https://github.com/msgbyte/tianji/commit/ff5b7773921d6382cc751cb5195629cc323e331e))
* improve metric block display and create logic, improve user experience ([dae37b5](https://github.com/msgbyte/tianji/commit/dae37b5bb4c578913c19e10da288dfc1d146479d))
* improve sdk package ([ebb69a4](https://github.com/msgbyte/tianji/commit/ebb69a421998376559d6fbec692972e62851ca8a))
* improve some detail ([c131078](https://github.com/msgbyte/tianji/commit/c1310784dad5abf907fbc64c25b74f8229252e9e))
* improve tip and style ([13ee7f5](https://github.com/msgbyte/tianji/commit/13ee7f5a0644d6d0effaef3d03e1a2a5bd08656a))
* init example repo ([55fc93d](https://github.com/msgbyte/tianji/commit/55fc93da7ed6a20d01b1d7b5ae7548d6e26c45ee))
* move insights to other router ([074aa56](https://github.com/msgbyte/tianji/commit/074aa56898b232d6c7e730e143f4ef3cc6107998))
* refactor metric block and add reused part of dropdown ([e855fb6](https://github.com/msgbyte/tianji/commit/e855fb68d644200fe0be7f981426e4323d7dd696))
* release v1.17.7 ([081f102](https://github.com/msgbyte/tianji/commit/081f1025ba1fa3a70421838cb086de41ccdb057e))
* release v1.17.8 ([7dbfb6f](https://github.com/msgbyte/tianji/commit/7dbfb6f7db1738b4078a01eee81baaddfce20e15))
* release v1.17.9 ([6cceb40](https://github.com/msgbyte/tianji/commit/6cceb407a8907acbb626bef84e9184f2ca40d4b7))
* update react version in example repo ([313f909](https://github.com/msgbyte/tianji/commit/313f9093d8f4eb459ee6d941580a34f9d6379d47))
* update translation ([7a714b5](https://github.com/msgbyte/tianji/commit/7a714b56abcb8b91d7336e9ecd8079f269f9bae2))
* update translation ([74f62e2](https://github.com/msgbyte/tianji/commit/74f62e20b732620b03af498c67cccc83112e598c))
* upgrade execa version ([1321986](https://github.com/msgbyte/tianji/commit/1321986930cda06b60e9c6c9a8b1ac6d48963f72))
* upgrade react-icons version v4 -> v5 ([bc1a9d2](https://github.com/msgbyte/tianji/commit/bc1a9d28728daac4d315c80171d9f77a52fd4bab))

## [1.17.9](https://github.com/msgbyte/tianji/compare/v1.17.8...v1.17.9) (2025-01-21)

### Others

* fix trpc-to-openapi use incorrect middleware problem ([707d6fa](https://github.com/msgbyte/tianji/commit/707d6fa800dc917a8673927b973565995fdb398a))

## [1.17.8](https://github.com/msgbyte/tianji/compare/v1.17.7...v1.17.8) (2025-01-21)

### Others

* add null ip process ([2789ec7](https://github.com/msgbyte/tianji/commit/2789ec7d95b0658a6742ef3b98a77318e647e15b))

## [1.17.7](https://github.com/msgbyte/tianji/compare/v1.17.6...v1.17.7) (2025-01-19)

### Bug Fixes

* fix a issue which will make openai key is required(original should be optional) [#139](https://github.com/msgbyte/tianji/issues/139) ([1ed859b](https://github.com/msgbyte/tianji/commit/1ed859b56c0fb68b536ad83ad2c9b649cc0a853b))

## [1.17.6](https://github.com/msgbyte/tianji/compare/v1.17.5...v1.17.6) (2025-01-04)

### Features

* add auto refetch logic in status page and refactor status page header ([9ccae18](https://github.com/msgbyte/tianji/commit/9ccae18b2b00882a5634237078443e008dc607f4))
* add openai endpoint ([cc41483](https://github.com/msgbyte/tianji/commit/cc41483d93294bde2dd0c81657c028b849ff0364))
* add openai sse api ([4b1f6c2](https://github.com/msgbyte/tianji/commit/4b1f6c218219f6b83fb87b784d2ed5bc0d18ec70))
* add timezone support in trpc ctx and monitor.publicSummary ([890bf18](https://github.com/msgbyte/tianji/commit/890bf182d71023b2ba4fa050e2fb49f34099e5a4))
* add workspace bill model ([58a04aa](https://github.com/msgbyte/tianji/commit/58a04aa0eaff4391733cf77b7bb43e1d6e447d8a))
* allow register command in page ([e7297b1](https://github.com/msgbyte/tianji/commit/e7297b1a5781349ed87d6cb8ea0a84975e978e50))

### Others

* fix ci problem ([67c4fa3](https://github.com/msgbyte/tianji/commit/67c4fa305af8ffc60d31c6f598aad2434811de81))
* migrate react query to v5 ([45c91f8](https://github.com/msgbyte/tianji/commit/45c91f805314d787e8d888c15720200c7afa7fef))
* upgrade trpc version to next ([dfec38c](https://github.com/msgbyte/tianji/commit/dfec38cce440b77c7bc281cad8fdefb614c0cf09))

## [1.17.5](https://github.com/msgbyte/tianji/compare/v1.17.4...v1.17.5) (2024-12-25)

### Features

* add default header preset in http monitor ([60a1d84](https://github.com/msgbyte/tianji/commit/60a1d847497604be32a7f89e2e274c997cdaaa5f))
* add insight route in dev ([04e93bf](https://github.com/msgbyte/tianji/commit/04e93bf542594e4bbfa85d0cd44dac0617f8faa3))
* add new login background ([6f367c2](https://github.com/msgbyte/tianji/commit/6f367c2c48c9621e3070055bea42229f136093a6))
* add paused tip ([d688a78](https://github.com/msgbyte/tianji/commit/d688a787427d1fd6d349a7576468021c8a795d13))
* add survey stats chart ([536e3b1](https://github.com/msgbyte/tianji/commit/536e3b1c6212d59b438f75ed6795e8b9e3c7f5e2))

### Document

* add aapanel install guide ([ba39fab](https://github.com/msgbyte/tianji/commit/ba39fab4dfa3ea95f114f2961a9eeae3dfda24cf))
* add cloud link ([0ac3f41](https://github.com/msgbyte/tianji/commit/0ac3f414f9212eccfdaec0699eb3e5c7d7eab390))
* update aapanel version and name of china ([1cf43cc](https://github.com/msgbyte/tianji/commit/1cf43cc2a5fe83a9f6b2a3aa0c76674cc06c87fd))
* update changelog ([a0c54ba](https://github.com/msgbyte/tianji/commit/a0c54ba01bac691823c45f00781b73b7d72ded09))
* update website and make cloud entry more strong ([4df9a5f](https://github.com/msgbyte/tianji/commit/4df9a5f6867e33a61ceacba074179f38d6aa6431))

### Others

* add clickhouse config ([8daabe3](https://github.com/msgbyte/tianji/commit/8daabe322e761aea1257c39e9947a7c7d7196a7e))
* add dev container for insights feature ([f8ba1dc](https://github.com/msgbyte/tianji/commit/f8ba1dc4d00db347e59d50612d9530643834555c))
* fix typo ([6b34f10](https://github.com/msgbyte/tianji/commit/6b34f10bfd3d00a5bf8b0a5706422a8ee75455df))
* move k8s folder to docker/k8s folder. ([08b37ce](https://github.com/msgbyte/tianji/commit/08b37ce16b1494731bf5140465a09659d2c186a4))
* move TimeEventChart component ([e5cc2ee](https://github.com/msgbyte/tianji/commit/e5cc2eebf84eb7aaba6747939d0a14d42f337de0))
* update monitor page style ([691bc4b](https://github.com/msgbyte/tianji/commit/691bc4bdb3fc4cc5d030616cb272ce2153b88e5f))

## [1.17.4](https://github.com/msgbyte/tianji/compare/v1.17.3...v1.17.4) (2024-11-29)

### Document

* update npm config ([ed591e2](https://github.com/msgbyte/tianji/commit/ed591e207d00d86b08989407d22ace1400bd0fd3))
* update openapi document [#130](https://github.com/msgbyte/tianji/issues/130) ([0f3168e](https://github.com/msgbyte/tianji/commit/0f3168e340ab292cbf905b9d89dc666da809b96f))
* update roadmap ([c7bd2e6](https://github.com/msgbyte/tianji/commit/c7bd2e6fb960996111cca091fa8dac1307457980))

### Others

* change init state of global config ([e0da48f](https://github.com/msgbyte/tianji/commit/e0da48f4d438676ea094b39ea87e0d04248d83ca))
* update code style ([99db3d0](https://github.com/msgbyte/tianji/commit/99db3d02e370b9d252919d216ad0e1b36540d199))

## [1.17.3](https://github.com/msgbyte/tianji/compare/v1.17.2...v1.17.3) (2024-11-27)

### Features

* add email login ([cc1cc95](https://github.com/msgbyte/tianji/commit/cc1cc9536e6626a232cdab4d31a5c6b7b8717061))

### Others

* a not cool solution, refresh state again after 5s. ([5ed182b](https://github.com/msgbyte/tianji/commit/5ed182b7f8d7169d4336fd957f14a4f74ab77455))
* update translations ([26d555f](https://github.com/msgbyte/tianji/commit/26d555f9fae8dc6f72cdaafb9c16b891025a17be))
* upgrade package version to reduce vulnerabilities ([72458fe](https://github.com/msgbyte/tianji/commit/72458fe301267d5e9bcfd2b3903907439bd4d143))
* upgrade release-it version ([947f364](https://github.com/msgbyte/tianji/commit/947f364a36ca035f797f210ae72a75ceff6d775e))

## [1.17.2](https://github.com/msgbyte/tianji/compare/v1.17.1...v1.17.2) (2024-11-25)


### Features

* add free tier tip component ([1fc4d15](https://github.com/msgbyte/tianji/commit/1fc4d15c35e1c7b161aab968c4c8e595ef6c80b7))
* add workspace usage check which can update when tier has updated ([bf0598d](https://github.com/msgbyte/tianji/commit/bf0598dd25b8e1b868a5f3ea3fad53a58d8c9dd4))


### Bug Fixes

* fix a bug that would accidentally pause the workspace ([420860f](https://github.com/msgbyte/tianji/commit/420860f1b6e25928d9444c9b64f7308dde83a472))


### Others

* update translation ([df12949](https://github.com/msgbyte/tianji/commit/df1294977fcfd1e1005919d8d5cf8b9c926b0473))

## [1.17.1](https://github.com/msgbyte/tianji/compare/v1.17.0...v1.17.1) (2024-11-21)


### Others

* improve install script which make easy to install in non-root user ([53777b3](https://github.com/msgbyte/tianji/commit/53777b36c6387f7cd06833a28bf479d38ab00162))
* update limit check logic ([927eac1](https://github.com/msgbyte/tianji/commit/927eac1da3c56be9bfabc1513b74ae26b3c6e01c))
* update subscription redirect tip ([21ac087](https://github.com/msgbyte/tianji/commit/21ac0878f90194ca140044b69c07fc085c72cac3))

## [1.17.0](https://github.com/msgbyte/tianji/compare/v1.16.5...v1.17.0) (2024-11-19)


### Features

* add <UsageCard /> component which can render usage data and progress ([a12fa3e](https://github.com/msgbyte/tianji/commit/a12fa3e6feedb3c7d83a097e187aa9945ff9bb10))
* add api key and usage to command panel ([71f75c2](https://github.com/msgbyte/tianji/commit/71f75c27ddf83ec3ac3855a07b03db5d4182c514))
* add api key fe and usage counter ([6a4bdd3](https://github.com/msgbyte/tianji/commit/6a4bdd324c2a2fd64219edf637dcfe2fa0959067))
* add audit log clear feature ([3bf86b3](https://github.com/msgbyte/tianji/commit/3bf86b3e6e6c5e86cbeb3cd9b7aaa41a53dd5439))
* add auto language detect for browser ([1629546](https://github.com/msgbyte/tianji/commit/162954606a36219c58cd5a36c4a32a325b9a80cb))
* add create feed and website limit which in max tier limit ([c8d4063](https://github.com/msgbyte/tianji/commit/c8d4063dafe24c8bec0501459bc77af71a848cd1))
* add cronjob to check workspace limit which will pause workspace ([31ad64c](https://github.com/msgbyte/tianji/commit/31ad64cd955e5dd31167ae5fca6c0e49b7475977))
* add lemonsqueezy  subscription ([74d391a](https://github.com/msgbyte/tianji/commit/74d391afc15a251a7098e4a5c8716bad3b756bd0))
* add monitor error message ([e23258a](https://github.com/msgbyte/tianji/commit/e23258ac484de777a3c4a952df7b7307153a0b4a))
* add more usage stats ([b71bf65](https://github.com/msgbyte/tianji/commit/b71bf6542e7312ec6ae0fdcc5008a197c1dc23d2))
* add subscription selection page ([843a581](https://github.com/msgbyte/tianji/commit/843a581d429b11cb6959e6aee2d50eb9e144f3e5))
* add user api key backend support ([f7b1d33](https://github.com/msgbyte/tianji/commit/f7b1d33c5d5bcd6d3ff8215412a4635495b35b7c))
* add workspace pause tips ([b4bee32](https://github.com/msgbyte/tianji/commit/b4bee321ae512d49768522419996b430d569a3f3))
* add workspace paused check ([77e14d3](https://github.com/msgbyte/tianji/commit/77e14d315f731204f1a38c2294d26d7cbe204ab8))
* add workspace subscription ([e4b98b1](https://github.com/msgbyte/tianji/commit/e4b98b1c36f5362b88b73ff759378cc02185a836))
* subscription switch and cancel handler() ([f2f8267](https://github.com/msgbyte/tianji/commit/f2f8267fef98accfd145f56c1c3a6ebab91d45cb))


### Bug Fixes

* fix ci probelm ([c7ef57b](https://github.com/msgbyte/tianji/commit/c7ef57b4c6bdcd79f95c499a02127d16916b3370))
* fix isUser middleware will call twice problem ([c70e698](https://github.com/msgbyte/tianji/commit/c70e69879fe5ddc7f0dffcd546c79e79b50f034b))
* fix url too long problem [#125](https://github.com/msgbyte/tianji/issues/125) ([c33d5bb](https://github.com/msgbyte/tianji/commit/c33d5bbedeb7890c06fbada71892c22639766a91))


### Others

* add alert ([ea75ed7](https://github.com/msgbyte/tianji/commit/ea75ed7f88f8ffc2290c85096c332b25f98305d9))
* add apikey check before setup ([f0ddf6c](https://github.com/msgbyte/tianji/commit/f0ddf6c5ddbba871496eb77a02bf515e732809fa))
* add usage limit and update card style ([34f9fe6](https://github.com/msgbyte/tianji/commit/34f9fe6957a53b46397f47210ec27dabcfc5f482))
* change check workspace pause logic ([aed707a](https://github.com/msgbyte/tianji/commit/aed707a76146126a89e2edcf3a84e8307ba52806))
* move billing mode inside folder ([fa1ff3b](https://github.com/msgbyte/tianji/commit/fa1ff3b5f6d93cce615b64bfeac0006f57291820))
* move monitor action to hooks, reduce file size. ([ae33b52](https://github.com/msgbyte/tianji/commit/ae33b52d45f60d3abfc912b8c8d789a67c06e073))
* remove passport package ([ae5f5a9](https://github.com/msgbyte/tianji/commit/ae5f5a97d99406df68ef92b2c5b958ec5ac2099c))
* remove unused script ([fffc989](https://github.com/msgbyte/tianji/commit/fffc989336e8733d2f166d6e620fa379e2eb1d59))
* update translation ([33b2ea5](https://github.com/msgbyte/tianji/commit/33b2ea581b2cbd52541ac983f8d22c5fa81239e6))
* upgrade package version ([a03c182](https://github.com/msgbyte/tianji/commit/a03c1824f80f7807d8a3fb59cc47b8ebc4ed5ef3))

## [1.16.5](https://github.com/msgbyte/tianji/compare/v1.16.4...v1.16.5) (2024-11-02)


### Features

* add webhookSignature in feed channel ([6b3631e](https://github.com/msgbyte/tianji/commit/6b3631eae186b9cacf64d0ddcfbb66378e041281))


### Bug Fixes

* add key to Fragment in map for monitor items ([9949b97](https://github.com/msgbyte/tianji/commit/9949b973bd63b4ad6b5e71f7b819442f505c09a6))
* retrieve date as string ([a8a47ed](https://github.com/msgbyte/tianji/commit/a8a47ed94dda87c3fe4cdecc0acb9a31f53f00a5))


### Others

* fix ci problem ([59b8746](https://github.com/msgbyte/tianji/commit/59b874644fd3427bc86cd2a7e948054e827de080))
* refactor status header and add typescript and translation support ([f637ade](https://github.com/msgbyte/tianji/commit/f637ade70f230fbf472bdee84105c9b284d6b8d4))
* update amount in stripe ([2725056](https://github.com/msgbyte/tianji/commit/272505669e450d882930cbf594dac39a879b2072))
* update webhooks signature api guide ([266b08f](https://github.com/msgbyte/tianji/commit/266b08f2da16d0457a5a44b4a7a251d28502abc9))

## [1.16.4](https://github.com/msgbyte/tianji/compare/v1.16.3...v1.16.4) (2024-10-27)


### Features

* add stripe feed integration ([09d0f02](https://github.com/msgbyte/tianji/commit/09d0f02d844159565e97bb64f076e0bbe218ce98))


### Others

* update currency symbols in feed ([98298c4](https://github.com/msgbyte/tianji/commit/98298c43670326b4e2300a6bbdeee3daa53f0eb3))

## [1.16.3](https://github.com/msgbyte/tianji/compare/v1.16.2...v1.16.3) (2024-10-24)


### Others

* fix ci problem and upgrade version ([1c5737e](https://github.com/msgbyte/tianji/commit/1c5737e588d19e0657be6437792cf4484b6fdddb))

## [1.16.2](https://github.com/msgbyte/tianji/compare/v1.16.1...v1.16.2) (2024-10-23)


### Features

* add prometheus report support ([fcb8f22](https://github.com/msgbyte/tianji/commit/fcb8f221168281ab710d3d3f12064a99d17b39e7))


### Bug Fixes

* fix a bug which will match incorrect path [#115](https://github.com/msgbyte/tianji/issues/115) ([79667a9](https://github.com/msgbyte/tianji/commit/79667a9644b78451400acb6a6bbf07b6ca61e6e0))


### Document

* update README ([1df32dc](https://github.com/msgbyte/tianji/commit/1df32dc2579f32649afd6c008512c1190a45fd9e))


### Others

* fix ci problem ([554f902](https://github.com/msgbyte/tianji/commit/554f9025847defe0b05492cf07a5dc8acc6c3685))
* update openapi document ([e402ee1](https://github.com/msgbyte/tianji/commit/e402ee1688bb77d83463ce70c5e730c97f68a695))

## [1.16.1](https://github.com/msgbyte/tianji/compare/v1.16.0...v1.16.1) (2024-10-20)


### Features

* add test notify ([4e3fd9d](https://github.com/msgbyte/tianji/commit/4e3fd9db64629f7721e6092b86b06144c47f521d))
* add timezone support [#114](https://github.com/msgbyte/tianji/issues/114) ([c7e20df](https://github.com/msgbyte/tianji/commit/c7e20df516bf3a991ce46c937223948bcdb6b8f0))
* add workspace settings manage ([3dca8fc](https://github.com/msgbyte/tianji/commit/3dca8fc27c82bd96dbab423b111e4de57f3b4bd8))


### Others

* update cronjob clear time ([83850f2](https://github.com/msgbyte/tianji/commit/83850f2981ded0b6624556ee3430f684752b8ea3))

## [1.16.0](https://github.com/msgbyte/tianji/compare/v1.15.8...v1.16.0) (2024-10-19)


### Features

* add click event for status page item which allow hide/show chart ([279e616](https://github.com/msgbyte/tianji/commit/279e616bee510ee5b0c5a3c9a3705a79efd5d3cb))
* add daily monitor data display for public ([dcff57f](https://github.com/msgbyte/tianji/commit/dcff57fe69273c7f9b3dd9c28e8acc9cb6e430a9))
* add monitor summary function ([bbb8d88](https://github.com/msgbyte/tianji/commit/bbb8d881168df695ccc70743f46320b39c1d7718))
* add MonitorLatestResponse and up status summary ([316b954](https://github.com/msgbyte/tianji/commit/316b95467d49b3ebe93d03006d4b90f9ca482262))


### Bug Fixes

* fix reporter memory leak problem [#103](https://github.com/msgbyte/tianji/issues/103) ([7f70557](https://github.com/msgbyte/tianji/commit/7f70557c776c35e4e01a5533d2c05cecc711e113))


### Others

* add border radius in smtp template ([f553f15](https://github.com/msgbyte/tianji/commit/f553f157dd9708d553c9d6cfca4d119a62d849c3))
* change public summary display logic ([e5e77db](https://github.com/msgbyte/tianji/commit/e5e77dbdeeeecb773237b84e3c671dd16e61d458))
* fix ci problem ([820b25b](https://github.com/msgbyte/tianji/commit/820b25baedc6fec02010ca19b43e4da99bf4b820))
* ignore unknown sentry log ([527f734](https://github.com/msgbyte/tianji/commit/527f734bc442458018d86df9a7e750a8e8de4495))
* let version text more prominent ([61980b3](https://github.com/msgbyte/tianji/commit/61980b37d3cecce32fa87b2b9810f4c715990a71))
* rename old tsconfig paths ([2a503ca](https://github.com/msgbyte/tianji/commit/2a503ca2501e705430c0c35cb7c8279927c1d4d5))

## [1.15.8](https://github.com/msgbyte/tianji/compare/v1.15.7...v1.15.8) (2024-10-13)


### Features

* add payload for feed event integration and send function ([572d96b](https://github.com/msgbyte/tianji/commit/572d96babb348858911105659bfe304e869915e4))
* add ping animation in website realtime visitor ([6da0e6f](https://github.com/msgbyte/tianji/commit/6da0e6f415e863448cd36246eb16e1f09dcd8a79))
* add plausible tracking(for testing) ([6474cef](https://github.com/msgbyte/tianji/commit/6474cefd896b36b872460786b11005b8deaf4436))
* add realtime datarange which can visit data more easy ([f3d8f55](https://github.com/msgbyte/tianji/commit/f3d8f5543d4e277fe34940ce98cd552dee45f2a8))
* add survey curl example code ([5d54ca1](https://github.com/msgbyte/tianji/commit/5d54ca1cbc01b69b9bd03d167edd0db242df350e))
* add survey webhook ([de57242](https://github.com/msgbyte/tianji/commit/de572426ebf99e99ff97ce49caf0b8ac13b68154))
* sdk add send feed function export ([f5933ec](https://github.com/msgbyte/tianji/commit/f5933ec0548fb4ac327152b6d7afe7ca2978bade))
* survey add webhook url field which can send webhook when receive any survey ([f00163b](https://github.com/msgbyte/tianji/commit/f00163b2f107bcf08d4ff398fa5dbd92ac36fda8))
* time event chart legend add some interaction ([4b78771](https://github.com/msgbyte/tianji/commit/4b7877155fd54416fb9231a02aca0e868aec97d2))


### Document

* add shacdn to website ([763810e](https://github.com/msgbyte/tianji/commit/763810e8b7e6cd41fdc0d83d28262dc7d747e4bf))
* add sitemap to improve SEO ([384224c](https://github.com/msgbyte/tianji/commit/384224cb624030522057df22527312957665d8e9))
* add website more language: de, fr, ja, zh-Hans ([7bda542](https://github.com/msgbyte/tianji/commit/7bda5420c5f22f6205d2dbd5086dd0bdbbc7f558))
* change code command line style ([8c5c417](https://github.com/msgbyte/tianji/commit/8c5c417a197531c187452fc4937d034d3bdc05a7))
* remove used blog directory ([3d9d032](https://github.com/msgbyte/tianji/commit/3d9d03296e9fb26eb363b2dba2f830f2eb9d58f3))
* resolve build problem with update source document content ([9e6e031](https://github.com/msgbyte/tianji/commit/9e6e03117cc3bd37058563e31817034876d35450))
* update depenpendency to resolve issue of docusaurus build ([de38363](https://github.com/msgbyte/tianji/commit/de38363315275ecbc7384c935c313940fca1d4fc))
* upgrade openapi ([1e57905](https://github.com/msgbyte/tianji/commit/1e57905f3239cc4fb3a949b469161dc9c8d2b40c))


### Others

* add CodeExample component ([29f184c](https://github.com/msgbyte/tianji/commit/29f184c15d36e42af750261f81ad67b49fe58c0b))
* comment sitemap to make sure its can build safe ([9b9799e](https://github.com/msgbyte/tianji/commit/9b9799ec6f846eb40762f5ca8cc0aa6c27fb7e02))
* fix ci problem ([a32f3d9](https://github.com/msgbyte/tianji/commit/a32f3d9824a09a2d8c9e97ba211ee5d44c8e2763))
* fix isolated-vm version ([43b4c9f](https://github.com/msgbyte/tianji/commit/43b4c9fe3763673dc54b61b01e50bc5b3d24a371))
* fix version of postman-code-generators ([eaffe3a](https://github.com/msgbyte/tianji/commit/eaffe3ab21022215a76c3441ef0b9b2c37386227))
* improve display of visitor map if data is too much ([9bc8c63](https://github.com/msgbyte/tianji/commit/9bc8c63fe2ea2ab080e7db3cf7d0c7636fabf8d1))
* migrate monitor data chart to recharts and remove @ant-design/charts ([c0e2ef0](https://github.com/msgbyte/tianji/commit/c0e2ef0fe8f5520a7b935eeeb44f6be9224e56a4))
* update ci run trigger path ([7322ad7](https://github.com/msgbyte/tianji/commit/7322ad741dcfc5c033b5057e1862e91d27244f7f))
* update pnpm lock file to resolve some magic problem ([064dbe9](https://github.com/msgbyte/tianji/commit/064dbe9985767b32492de4264d08c26206318cd4))
* update survey edit form ([a218c22](https://github.com/msgbyte/tianji/commit/a218c2239725deb5bcdee2e8d2de377e04dec941))
* upgrade @radix-ui/react-scroll-area version ([9d559b9](https://github.com/msgbyte/tianji/commit/9d559b93d16c130cf58649e0f12edf9e795ba8a5))
* upgrade @tianji/website docusaurus version ([e46f970](https://github.com/msgbyte/tianji/commit/e46f97097a593fe4bd5a8946237fd2f46fea69f6))
* use prebuilt rather than deploy build ([e51a880](https://github.com/msgbyte/tianji/commit/e51a88044fcef7727b2e7f17c5dd9eff08329cdc))

## [1.15.7](https://github.com/msgbyte/tianji/compare/v1.15.6...v1.15.7) (2024-10-03)


### Bug Fixes

* fix a problem which will make request list incorrect ([2d5a09c](https://github.com/msgbyte/tianji/commit/2d5a09c79cae48f62029b8767bae552376e68639))


### Document

* fix update code to new version ([1fe5009](https://github.com/msgbyte/tianji/commit/1fe50092bab5e0824c1b96b70d40d33f751f4135))


### Others

* split website from monorepo ([e09d7ee](https://github.com/msgbyte/tianji/commit/e09d7eef8788e27ac651f18dcf4d04de895a35ee))
* update workspace config and remove unused lock file ([7301eeb](https://github.com/msgbyte/tianji/commit/7301eeb82a4fdc4ae6853dbe98c1f1d7b9b79bca))

## [1.15.6](https://github.com/msgbyte/tianji/compare/v1.15.5...v1.15.6) (2024-10-02)


### Others

* add build dependency for build zeromq ([79b75f5](https://github.com/msgbyte/tianji/commit/79b75f55e39c057c330bc1fb0b3b15dc10e28a78))
* improve install package time in docker build static stage ([1be03cc](https://github.com/msgbyte/tianji/commit/1be03ccf532a7dd6d23334a5666dec34e2e68d77))
* update NODE_OPTIONS in static layer to make sure build can pass ([5eb7696](https://github.com/msgbyte/tianji/commit/5eb7696ead2da961d6ac5223a2badb48502142ba))

## [1.15.5](https://github.com/msgbyte/tianji/compare/v1.15.4...v1.15.5) (2024-10-01)


### Features

* add error message for lighthouse ([bb0c574](https://github.com/msgbyte/tianji/commit/bb0c57489347242300c6153ed3908d1822bb692c))
* add lighthouse score in database fields ([6c2a093](https://github.com/msgbyte/tianji/commit/6c2a0938423385d67309deefa67a3d971bf8d7c8))
* add webhook playground ([33a0a60](https://github.com/msgbyte/tianji/commit/33a0a60eee53d1ac08cc9accc2e96f06e56ebb52))
* add webhook playground entry ([92196e4](https://github.com/msgbyte/tianji/commit/92196e4e5bb9b183cfe85aad876115c0e17f824e))
* add zeromq to make sure lighthouse can only run one at same time ([50a3573](https://github.com/msgbyte/tianji/commit/50a35732ff202f2452b344c2df17aba677426ec3))


### Others

* improve avatar display timing for non-avatar user ([04dc1e9](https://github.com/msgbyte/tianji/commit/04dc1e98dd448c0fd6661559722cf594ab2e751e))
* refactor time event chart to recharts ([1337eaa](https://github.com/msgbyte/tianji/commit/1337eaa2c0ff55651a05878edd722ac1b46a5067))
* update style of website page card ([b778f8c](https://github.com/msgbyte/tianji/commit/b778f8c982f7df8328c2fffe67783b15cde51c15))
* upgrade shadcn cli and add recharts ([055f57e](https://github.com/msgbyte/tianji/commit/055f57e087f002b8f891053509e3cad865f1d52b))

## [1.15.4](https://github.com/msgbyte/tianji/compare/v1.15.3...v1.15.4) (2024-09-30)


### Features

* allow rename workspace ([63e6bfe](https://github.com/msgbyte/tianji/commit/63e6bfe0d1a989479a6c4658d01ea9d84fc84b45))


### Bug Fixes

* fix login view split incorrect if not any extra login way ([b16a7c3](https://github.com/msgbyte/tianji/commit/b16a7c3c2c203394c94ccfee8e829bc7685a2457))
* remove workspace name validation ([7c271dc](https://github.com/msgbyte/tianji/commit/7c271dc3c14fc6c751fb69b16adf6f08bfd5ac7b))


### Others

* add ignore in docker build ([ee72f74](https://github.com/msgbyte/tianji/commit/ee72f74e2c68c9baec500b78a3b994c8083abeed))
* add logger for lighthouse ([9d3e9d8](https://github.com/msgbyte/tianji/commit/9d3e9d89db40aad4a78df8b64ad3d7bfccb94d2e))
* add no sandbox args in puppeteer ([8b6a740](https://github.com/msgbyte/tianji/commit/8b6a74033c2838a6921c56990e13eedfbc8a559a))
* docker add puppeteer support ([23c6915](https://github.com/msgbyte/tianji/commit/23c691541db0a51b4765dd0943488def7741c0f4))
* downgrade alpine version to 3.19 to avoid issue ([e6df595](https://github.com/msgbyte/tianji/commit/e6df595af8ecddf734fe7e72a797921d84dad2c3))
* improve docker build and lighthouse config ([57ebaf6](https://github.com/msgbyte/tianji/commit/57ebaf6ad361cae3403263009b94566cc7de2293))
* improve websocket log ([b44e57d](https://github.com/msgbyte/tianji/commit/b44e57dde8d027eb05b7e8db20d490d2b62607cc))
* try to resolve no screenshot problem by remove single process. ([fe432f1](https://github.com/msgbyte/tianji/commit/fe432f13325adf5fb4cde3dbb2f4f1218cb789e7)), closes [/github.com/GoogleChrome/lighthouse/issues/11537#issuecomment-799895027](https://github.com/msgbyte//github.com/GoogleChrome/lighthouse/issues/11537/issues/issuecomment-799895027)
* unity esbuild version to resolve vulnerabilities which cause by esbuild ([bcc215c](https://github.com/msgbyte/tianji/commit/bcc215ca5d33126b368b58a9056d02fd93d5a99a))
* update dockerfile, carry back auto install dependency ([de09059](https://github.com/msgbyte/tianji/commit/de09059e6561a27e160f0e39e7987da8ad05edaa))
* update translation ([9c35bca](https://github.com/msgbyte/tianji/commit/9c35bca68508f2009434ebf578f0488a948e6b75))
* upgrade axios version to latest to resolve vulnerabilities ([d73fa10](https://github.com/msgbyte/tianji/commit/d73fa108978b3c965b07dda725fbe6ae20bc4140))
* upgrade puppeteer to make sure can fit with alpine image chromium version ([f59793d](https://github.com/msgbyte/tianji/commit/f59793d6f18625ad66b26d0a74aaa14c604ea812))
* upgrade puppeteer usage to fit new version ([1322741](https://github.com/msgbyte/tianji/commit/13227416c05e2eae5a1a99e5d5f3396679e83d89))
* upgrade puppeteer version to 23.4.1 ([e942769](https://github.com/msgbyte/tianji/commit/e942769af2e2570da71eb23f3ad489e8dcb72e95))

## [1.15.3](https://github.com/msgbyte/tianji/compare/v1.15.2...v1.15.3) (2024-09-24)


### Features

* add fixed server list ([4f2c112](https://github.com/msgbyte/tianji/commit/4f2c1129a0421934b43d3b6e02b17d629d275614))


### Others

* add language fallback to make sure its can be display correct ([31e8ce4](https://github.com/msgbyte/tianji/commit/31e8ce4ab9beec4af730b9302c0c3b861234123e))
* clear unused code ([cdc3ce1](https://github.com/msgbyte/tianji/commit/cdc3ce122386e632f6b4350bc3dd4bdf4c17e0ed))
* improve monitor detail style, enhance style difference ([f2ce1fb](https://github.com/msgbyte/tianji/commit/f2ce1fb10c92a2e2583ec3b36866308954958e1e))

## [1.15.2](https://github.com/msgbyte/tianji/compare/v1.15.1...v1.15.2) (2024-09-23)


### Features

* add admin role and change most owner permission to admin ([79ed059](https://github.com/msgbyte/tianji/commit/79ed059d995da6eaabc452a0844b9acb69dc981c))
* add label map for device type in website ([f16ccb5](https://github.com/msgbyte/tianji/commit/f16ccb56895f65dea530be295b19f04a03c8ed99))
* add lighthouse reporter generate in website ([d29785a](https://github.com/msgbyte/tianji/commit/d29785a31184fe48913f7c49833c2d35a92c244a))
* add status page incident model ([d182041](https://github.com/msgbyte/tianji/commit/d1820416f4924b2fc1920383b2d22b042f6e0381))
* add workspace role permission check, hide non permission action ([4f4f9b5](https://github.com/msgbyte/tianji/commit/4f4f9b5d3f36192ea0f416997a43691674aa79fd))


### Others

* change default workspace name ([2058647](https://github.com/msgbyte/tianji/commit/205864720cdcbb5f46bee92fa6c577769a05f167))
* fix light mode color issues ([fb75a8b](https://github.com/msgbyte/tianji/commit/fb75a8b6545a507c81acafa9cb526afccd39cd35))
* invite add id support ([6a1f413](https://github.com/msgbyte/tianji/commit/6a1f413a384021d3c91e136be36a8c6375c74f99))
* update README roadmap ([4a1d704](https://github.com/msgbyte/tianji/commit/4a1d704fbb88bb87f7e9db61f3da1364fb7543c0))
* update translation ([6bf65cb](https://github.com/msgbyte/tianji/commit/6bf65cb529a2b0c52204063f2a10ad33e7b39aa5))

## [1.15.1](https://github.com/msgbyte/tianji/compare/v1.15.0...v1.15.1) (2024-09-19)


### Features

* add custom oidc/oauth provider support ([d0afdf5](https://github.com/msgbyte/tianji/commit/d0afdf5c91d2112d177ab7bb0315586cb64ad8d7))


### Bug Fixes

* fix website cannot delete problem [#91](https://github.com/msgbyte/tianji/issues/91) ([90953e4](https://github.com/msgbyte/tianji/commit/90953e490ceea8e5256fd564e4d220b2e7da50b3))


### Others

* add account provider ([84e4722](https://github.com/msgbyte/tianji/commit/84e4722f2fc8026de25fa33d23e17db61a6d4437))
* fix ci problem ([63484d0](https://github.com/msgbyte/tianji/commit/63484d0db59e1ccc178c7427ec7d60fd7f1484b0))

## [1.15.0](https://github.com/msgbyte/tianji/compare/v1.14.7...v1.15.0) (2024-09-18)


### Features

* add delete workspace feature [#96](https://github.com/msgbyte/tianji/issues/96) ([2b9a14c](https://github.com/msgbyte/tianji/commit/2b9a14c969c824d630452e0e4e30834f2a9a1b47))
* add group feature in backend ([4d39cb5](https://github.com/msgbyte/tianji/commit/4d39cb5ef4d95626e600289a1e949e78ccd7906f))
* add lighthouse endpoint ([28d982e](https://github.com/msgbyte/tianji/commit/28d982e497bfd04351c8495ec9ddd58fc205e771))
* add lighthouse html report endpoint ([943f7f5](https://github.com/msgbyte/tianji/commit/943f7f594ba90aa037ab5cb1b057f496e8a5fcb2))
* add logout button in switch workspace page ([6ce2f7f](https://github.com/msgbyte/tianji/commit/6ce2f7fd4dbcd56b5a5f493108138e8c8447619b))
* add sortable group component ([ef30750](https://github.com/msgbyte/tianji/commit/ef307508026bf516d321da933c298d87efd0b902))
* refactor sortable group component and add edit body component ([946ecaf](https://github.com/msgbyte/tianji/commit/946ecaf9f946dfb2d85541170a7441ba6e782e5a))


### Others

* add body spaces ([12b8ba9](https://github.com/msgbyte/tianji/commit/12b8ba95b7720d384f8ae607cea0f4133d5f4fc4))
* add new editable text component which allow to change group title ([e323e10](https://github.com/msgbyte/tianji/commit/e323e104e03569b7131dc1aac1e15c548ebe8485))
* add sortable group component which using react-beautiful-dnd ([91ade2a](https://github.com/msgbyte/tianji/commit/91ade2ab555e43dc36ec32c7e9cb2856ffccd5ae))
* change edit style and logic, create new MonitorPicker component ([72a1e7b](https://github.com/msgbyte/tianji/commit/72a1e7b0249c69510af7650e19bf939ed88cf550))
* fix ci problem and remove unused code ([95b51ca](https://github.com/msgbyte/tianji/commit/95b51ca2e160bf835aafb770e0a11b8ad0fc5858))
* improve admin style in status page ([ed2141a](https://github.com/msgbyte/tianji/commit/ed2141af22a6103ea5be850eff57be7f24d9011b))
* improve some style in server status page ([427e9e3](https://github.com/msgbyte/tianji/commit/427e9e3eb7684a58a4c2cb597283c5a5319d9dd3))
* refactor server status edit form with react-hook-form ([6160d7b](https://github.com/msgbyte/tianji/commit/6160d7bcb9d3bf2a8b617b422e80fe7df8839967))
* remove sender name in notification ([f309000](https://github.com/msgbyte/tianji/commit/f309000a0c3a58a4e1df9c44803ea6a0299fe9ac))
* remove unused code and improve display view in status page ([f5151aa](https://github.com/msgbyte/tianji/commit/f5151aa2a4185714f1f988a2bad336b90f410b69))
* update translation ([ef3d344](https://github.com/msgbyte/tianji/commit/ef3d34423b71969f9a9afee0f64394e17a66143f))
* update translation ([8b86dcd](https://github.com/msgbyte/tianji/commit/8b86dcdceaf738cd27bbe6253825c9ef967c675f))
* update translation ([42f41cd](https://github.com/msgbyte/tianji/commit/42f41cdbcb2a4452fbdcf6013451d6008d6d97f1))
* upgrade @radix-ui/react-scroll-area version ([fc1e67e](https://github.com/msgbyte/tianji/commit/fc1e67e005fa7f4502807df1ab02c49b863bc4e4))

## [1.14.7](https://github.com/msgbyte/tianji/compare/v1.14.6...v1.14.7) (2024-09-10)


### Document

* add document and website entry in app ([f74289f](https://github.com/msgbyte/tianji/commit/f74289ff0539b4cf4141eafbc6fc6cec12529357))


### Others

* improve data table resizer width to make it more easy to use ([2e60945](https://github.com/msgbyte/tianji/commit/2e609452b55c6aa957fdff3dd96b6b617bda13ed))
* improve notification and feed channel filter logic ([e770e42](https://github.com/msgbyte/tianji/commit/e770e428936aa84c4ce0811c820ef4e43c2cdea3))
* update sentry feed content ([1895ac7](https://github.com/msgbyte/tianji/commit/1895ac772cec64c92c490a1a06d78df2eae05191))

## [1.14.6](https://github.com/msgbyte/tianji/compare/v1.14.5...v1.14.6) (2024-09-09)


### Features

* add unknown integration log ([d2afa54](https://github.com/msgbyte/tianji/commit/d2afa54301bcdd6a40fe5116b8191196c9b7bb33))

## [1.14.5](https://github.com/msgbyte/tianji/compare/v1.14.4...v1.14.5) (2024-09-07)


### Bug Fixes

* fix row header style issue ([cf4531c](https://github.com/msgbyte/tianji/commit/cf4531c5ddc1758a2d11776f058559622771b311))

## [1.14.4](https://github.com/msgbyte/tianji/compare/v1.14.3...v1.14.4) (2024-09-03)


### Document

* fix edit page url ([8ccace1](https://github.com/msgbyte/tianji/commit/8ccace127ba6aae012e5c164dbcaa42ee299196c))
* update manual install to include code update ([2cc098a](https://github.com/msgbyte/tianji/commit/2cc098a5f1f184fa8e627e3d8d65a7910d9967c6))


### Others

* fix ci problem which cause build failed ([c4211c2](https://github.com/msgbyte/tianji/commit/c4211c270ffd6b1a6355a871676f0abed0f1e24f))

## [1.14.3](https://github.com/msgbyte/tianji/compare/v1.14.2...v1.14.3) (2024-09-02)


### Features

* add feed event url support ([8534ab7](https://github.com/msgbyte/tianji/commit/8534ab7ba029e4c98a642f4c927902455e97d4a9))
* add sentry webhook integration ([546055e](https://github.com/msgbyte/tianji/commit/546055e5559cf460e7d0f1dcce835e905baafc1e))


### Bug Fixes

* fix health bar style problem in page ([01d774d](https://github.com/msgbyte/tianji/commit/01d774d3958abd5ee15631eb771e22d5771f405a))

## [1.14.2](https://github.com/msgbyte/tianji/compare/v1.14.1...v1.14.2) (2024-09-02)


### Features

* add archive feature ([3270164](https://github.com/msgbyte/tianji/commit/3270164710179a534692eabca77285dd28d887a7))
* add curl feed api guide ([5588aca](https://github.com/msgbyte/tianji/commit/5588aca522646d88b7c9ddb5bff98e23c1d3bc15))
* add feed archive page ([87b4000](https://github.com/msgbyte/tianji/commit/87b4000c4791a935a0f9247d1c219529105d0801))
* add socket state ([e095a08](https://github.com/msgbyte/tianji/commit/e095a081b949880a088fd3e2512005d71d024769))
* feishu add markdown syntax support ([33de808](https://github.com/msgbyte/tianji/commit/33de808f3e4e6a763fc36de96f24e01055907aba))


### Document

* update Chinese translation ([9fcc6dd](https://github.com/msgbyte/tianji/commit/9fcc6dda60a6496fb1909cdc5facd0ebb60e9448))


### Others

* improve feed event report style ([88f47db](https://github.com/msgbyte/tianji/commit/88f47db118968aa323b6ee0eac6b14e4fe9aa608))
* update translations ([9966c12](https://github.com/msgbyte/tianji/commit/9966c1277c6bc8df74d9c3ca742b9e98c7577087))

## [1.14.1](https://github.com/msgbyte/tianji/compare/v1.14.0...v1.14.1) (2024-08-29)


### Others

* update pnpm version ([b9f5582](https://github.com/msgbyte/tianji/commit/b9f5582a02afffaff5777c85126e91e243ef82aa))

## [1.14.0](https://github.com/msgbyte/tianji/compare/v1.13.1...v1.14.0) (2024-08-29)


### Features

* add create workspace and switch workspace ([fac0838](https://github.com/msgbyte/tianji/commit/fac0838d8c7b14c7940170b733db0a33ca297b73))
* add delete workspace endpoint ([6fecde0](https://github.com/msgbyte/tianji/commit/6fecde0caa422c25ddbb9ec564afb44031b761da))
* add invite endpoint ([8c8b960](https://github.com/msgbyte/tianji/commit/8c8b960f61926aae415954dbef772e263d738ec5))
* add invite user form ([e0e0449](https://github.com/msgbyte/tianji/commit/e0e044945f02451ad2b1db8041e91a738589cd5d))
* add tick trpc endpoint ([7f33e2d](https://github.com/msgbyte/tianji/commit/7f33e2de0d0e0e1b4c2ff5d172f5d6c89e8dcd15))
* add unstar feed ([446ddaf](https://github.com/msgbyte/tianji/commit/446ddafa0afb534e02f767457973a1594a190f8f))
* add workspace page ([4918071](https://github.com/msgbyte/tianji/commit/491807165c7a4bd27b30961fdb3d525187d05ca3))


### Bug Fixes

* fix a style issue which workspace switch style broken with long name ([cbdb1c4](https://github.com/msgbyte/tianji/commit/cbdb1c4a079fcd19f03750dc3379f3e1aaaeb772))
* fix some case(maybe) can not key problem ([b64ca8b](https://github.com/msgbyte/tianji/commit/b64ca8b300f2bcbbbcbdf95b4e0d9780c1f64b1b))
* fix virtualize table loading and column style problem ([bb84661](https://github.com/msgbyte/tianji/commit/bb846616127e8ef823441b945390327a87b2f689))


### Document

* add private-policy page ([d136460](https://github.com/msgbyte/tianji/commit/d136460e39a69510e66952e76d42bca4016337a4))
* update openapi files ([79a7a92](https://github.com/msgbyte/tianji/commit/79a7a923d247a2581cca5b0e912bcbe35a892851))
* update website feed feature list ([ebd1e5e](https://github.com/msgbyte/tianji/commit/ebd1e5eb6648a424f078047125f31ce3a93bff03))


### Others

* add default error style problem ([3cc678f](https://github.com/msgbyte/tianji/commit/3cc678f09ec8d743f17b7b2f296475b2d37c8841))
* fix ci problem ([f7e1c81](https://github.com/msgbyte/tianji/commit/f7e1c8114b38c740f37e69125bd31fb26e1c2a1f))
* fix tsconfig problem in tsx ([40df49e](https://github.com/msgbyte/tianji/commit/40df49e1dbb5afda4a2d01b94e298e4f2dfaa2d5))
* improve healthbar display, will responsive with container size ([3990b0a](https://github.com/msgbyte/tianji/commit/3990b0a872d963900f52a97e869e7f26227c8107))
* update translation ([e983092](https://github.com/msgbyte/tianji/commit/e9830920378c71371946d526ef20335176cc8f18))
* upgrade @radix-ui/react-scroll-area to resolve scroll problem ([b862dd7](https://github.com/msgbyte/tianji/commit/b862dd74273faa78c65de916dce0a8fdafe9e834))
* upgrade package manager ([fa328fb](https://github.com/msgbyte/tianji/commit/fa328fb0bfe9ef47cce1d44ae16aee2628921e30))
* workspace switcher style and submit form reset ([5f47831](https://github.com/msgbyte/tianji/commit/5f47831f8e3f8df48fd287f6c4a23cb65270c21b))

## [1.13.1](https://github.com/msgbyte/tianji/compare/v1.13.0...v1.13.1) (2024-08-16)


### Features

* add feed template string of survey ([22fc5f9](https://github.com/msgbyte/tianji/commit/22fc5f98f8b646d6505a7a518074f5ce3f40215f))
* add FeedChannelPicker component ([5f6147e](https://github.com/msgbyte/tianji/commit/5f6147e3b6329c6fbeb7f8b1ac981f38fbe3e97a))
* add survey result send to feed channel feature ([d986210](https://github.com/msgbyte/tianji/commit/d9862105edd0f528dcf91d29142eaca9d78a8001))


### Document

* remove unmaintained readme ([5447f53](https://github.com/msgbyte/tianji/commit/5447f53b303fd43f8121fe9cccf5efc0326b7ace))


### Others

* fix ci problem ([3e3dc4c](https://github.com/msgbyte/tianji/commit/3e3dc4c22d765d7eea1d38e9f85c913982c656b6))
* remove lodash ([49d0da3](https://github.com/msgbyte/tianji/commit/49d0da3a6d54a65db7e11b1e9bb2e45fee228bdc))
* upgrade i18next-toolkit version ([59840b5](https://github.com/msgbyte/tianji/commit/59840b5f7b1cde4e6173dc1fa3b1bf39d3f701a7))

## [1.13.0](https://github.com/msgbyte/tianji/compare/v1.12.1...v1.13.0) (2024-08-11)


### Features

* add authjs backend support ([06d6ecd](https://github.com/msgbyte/tianji/commit/06d6ecd2a3384056be017c5608df282968802196))
* add avatar and nickname display in user info scope ([03bc9b5](https://github.com/msgbyte/tianji/commit/03bc9b5125070d2675b422723404c96fd2ac95ad))
* add duplicate feature for monitor ([827cf07](https://github.com/msgbyte/tianji/commit/827cf07c2a70b3437a8381ab3ee16838a348fd91))
* add email restrict ([0a0a275](https://github.com/msgbyte/tianji/commit/0a0a27549ace51bf0b8c9ef135c50fd859980525))
* add feed channel into search command panel ([275f30f](https://github.com/msgbyte/tianji/commit/275f30f0487a02e96289d8df5ea107bdd591212e))
* add github auth integrate ([7f7c95b](https://github.com/msgbyte/tianji/commit/7f7c95b11c664a15732f18b28ea1d154f289fca9))
* add logout and socketio auth ([e9c64c5](https://github.com/msgbyte/tianji/commit/e9c64c57e7b8bd8912669aef93d3958bb754a057))
* add none in feed channel ([73dd8c2](https://github.com/msgbyte/tianji/commit/73dd8c25b7f782a882682039a3cba94526af9906))
* add prisma migrate ([37757f6](https://github.com/msgbyte/tianji/commit/37757f6563d6de71a59aa1b021e7e29e9235eb3b))
* add support for legacy traditional login methods ([3afac06](https://github.com/msgbyte/tianji/commit/3afac062c417bfeef0536ee49a459de96ac7ae72))
* add survey count and feed event count ([f149642](https://github.com/msgbyte/tianji/commit/f1496429d30e13af8e810ae1dbc7ba74707d621d))
* add virtualized data table resizer ([f1aaa70](https://github.com/msgbyte/tianji/commit/f1aaa7040e7953d85b956f398df65873d9104205))
* add VirtualizedInfiniteDataTable and refactor survey result list ([b2dccec](https://github.com/msgbyte/tianji/commit/b2dccec2834a486dc018ac7b1d267bb327d48422))


### Bug Fixes

* fix tencentCloudAlarmMetricSchema incorrect problem ([914046a](https://github.com/msgbyte/tianji/commit/914046aefacafc0500585d55f8a2119685777ac3))


### Document

* add custom example for match text ([e4eee42](https://github.com/msgbyte/tianji/commit/e4eee420ea013068bc3d5fc0d9de436a6f69d65f))
* update README preview images ([bb76c8e](https://github.com/msgbyte/tianji/commit/bb76c8e895d5cb2ba5c8e5889d1a8ae15a605b48))


### Others

* add error log for tencent alarm ([af47920](https://github.com/msgbyte/tianji/commit/af4792024f3adc0b152f101e066f84077c98ecf7))
* add more log for tencent cloud alarm ([ad18666](https://github.com/msgbyte/tianji/commit/ad186668515c40e4127108a689accacc5b782760))
* add more translations ([05c358b](https://github.com/msgbyte/tianji/commit/05c358b2e5b18d74596fac8bb7ef2a0caf06b527))
* change all import with .js suffix, which will help nodejs(esm) to import code clear. ([d5d0446](https://github.com/msgbyte/tianji/commit/d5d04468cb210d0e2313ab66d494e09a8337a9d0))
* fix ci issue of typescript type check ([e5c2b94](https://github.com/msgbyte/tianji/commit/e5c2b9484fb761a2dff2f1e9f3dff3368f371712))
* fix ci problem ([c7ff366](https://github.com/msgbyte/tianji/commit/c7ff3666a7814936d8e5266df8e183fafbec6f96))
* fix react-router version ([20e95ef](https://github.com/msgbyte/tianji/commit/20e95ef97328fa1c0a3caab6a0ae20d54480eea0))
* remove ts-node and change to tsx ([b04ddd4](https://github.com/msgbyte/tianji/commit/b04ddd40ad483b773eeba0141b21ce80bfb4edbe))
* translate server side code into esm ([5dca262](https://github.com/msgbyte/tianji/commit/5dca262482adaadf6e25385bba0b1061ed9d33a4))
* update translation file ([7e38e32](https://github.com/msgbyte/tianji/commit/7e38e327bf3d8662e86a9c4320589f15d122ecd1))
* wip: add auth.js ([3cf3cfa](https://github.com/msgbyte/tianji/commit/3cf3cfa427b1d3ff6704e8839b60781eb7c15b32))

## [1.12.1](https://github.com/msgbyte/tianji/compare/v1.12.0...v1.12.1) (2024-07-25)


### Features

* add tencent cloud integration ([8585ea4](https://github.com/msgbyte/tianji/commit/8585ea4196e61934508f33e5120df8d854d6b18f))


### Bug Fixes

* fix code block not display well in light mode [#80](https://github.com/msgbyte/tianji/issues/80) ([0835fc5](https://github.com/msgbyte/tianji/commit/0835fc588bd0967d578abe34af9596fea2f29390))


### Document

* update pnpm version in manual install document ([9a7afed](https://github.com/msgbyte/tianji/commit/9a7afed08cb4aa80839fb83328a8ff300ac2141e))


### Others

* add fade in animation ([35a6e20](https://github.com/msgbyte/tianji/commit/35a6e20717d42ed4719b7dd441a89b079973d30e))
* change website config tabs to shadcn ui and improve ui ([f112adc](https://github.com/msgbyte/tianji/commit/f112adc696f7d2ded5d7619cf900e8156ea92d37))

## [1.12.0](https://github.com/msgbyte/tianji/compare/v1.11.4...v1.12.0) (2024-07-22)


### Features

* add channel feed notification ([67bfda3](https://github.com/msgbyte/tianji/commit/67bfda30bc95b5b8d11ff3994c6d097106e2c248))
* add colorized text for server status which help user find problem ([f2b20c5](https://github.com/msgbyte/tianji/commit/f2b20c5ef9a8d46aecb51b7c33720831c4e1ddf6))
* add custom feed integration ([765cc41](https://github.com/msgbyte/tianji/commit/765cc41c0637879c08f0cbb882d0decd03fc6e66))
* add date range and improve report display ([6e68a80](https://github.com/msgbyte/tianji/commit/6e68a8044dbda7a391800589ebb4cc2c828a8dbc))
* add dialog wrapper and improve display of webhook modal ([adb1cc3](https://github.com/msgbyte/tianji/commit/adb1cc391926b9fcea71f2db780e387b980b0b1d))
* add feed channel count ([a7688f0](https://github.com/msgbyte/tianji/commit/a7688f02af6a51d3786d4c91114a0e398c880fab))
* add feed endpoint ([f459c6b](https://github.com/msgbyte/tianji/commit/f459c6beeadaea6368e07375efa4845fe994305b))
* add feed event item created time ([926ea98](https://github.com/msgbyte/tianji/commit/926ea980ff130ba93c491fce9445b668f88175aa))
* add feed event notification with event and daily ([7bfd92b](https://github.com/msgbyte/tianji/commit/7bfd92be0b90cc5b9556a91f38627bdf015492d9))
* add feed page ([96a5a33](https://github.com/msgbyte/tianji/commit/96a5a33ad61c8b7bb4e4eae535acc659632aa914))
* add github integration support ([12fe9f0](https://github.com/msgbyte/tianji/commit/12fe9f0384ab08bc9013b22eb29140b14dae559f))
* add integration modal ([af5f6ad](https://github.com/msgbyte/tianji/commit/af5f6ad9f5853c344ceefe7a5e34730f364bfeae))
* add list content token ([7736bf8](https://github.com/msgbyte/tianji/commit/7736bf89dc94524d0cce6dc0b42a6ef430ecab2e))
* add more clear job ([b6bca6c](https://github.com/msgbyte/tianji/commit/b6bca6c250ded389b863e6e11adb77e5aa1b2911))
* add realtime feed event and desc feed list ([478d0c2](https://github.com/msgbyte/tianji/commit/478d0c2af3dd65d743a1ab36c0099a8449dc5224))
* add VirtualList support for feed events ([caf7e9c](https://github.com/msgbyte/tianji/commit/caf7e9ca72358772f3e47b593e7553b78578b226))
* add weekly and monthly cron job ([03904d2](https://github.com/msgbyte/tianji/commit/03904d26e08fbb755983568ed4dec7667f52982a))
* feed add markdown support ([56bbe09](https://github.com/msgbyte/tianji/commit/56bbe09005013276c0ac7324354cb63533ecd18e))
* github feed add star and issue support ([29939b6](https://github.com/msgbyte/tianji/commit/29939b6709e143ab9f68d008b79be38b3f13a6e7))


### Bug Fixes

* fix auditlog cannot fetch more data problem ([1b859e3](https://github.com/msgbyte/tianji/commit/1b859e31768b0f5b1a844989745e37e30d6ed478))
* fix problem of send notification ([82bb2ad](https://github.com/msgbyte/tianji/commit/82bb2ad267ae1f2922924fddb986b9f4e619eb1e))


### Document

* update category order ([b2480b0](https://github.com/msgbyte/tianji/commit/b2480b0ed57eccbc741de0652edbda8548b68db9))
* update roadmap ([e10cdfd](https://github.com/msgbyte/tianji/commit/e10cdfdf2612448938711b42fab2b8f160c3cab2))
* update webhooks document ([b355a67](https://github.com/msgbyte/tianji/commit/b355a677d3e36de4f53a73c59e23ab1aa0cb690e))
* update wechat qrcode ([503df45](https://github.com/msgbyte/tianji/commit/503df4546da7d11035f301db18650b4552d484f0))


### Others

* add document for endpoint ([537503f](https://github.com/msgbyte/tianji/commit/537503f288735de3c73f759291338ca74ce8d5d1))
* add dynamic virtual list ([01d81f3](https://github.com/msgbyte/tianji/commit/01d81f39296b80899c4fcaadda8dffa3f3f28803))
* add empty description message ([66ec94f](https://github.com/msgbyte/tianji/commit/66ec94fd08c24b901a0b8814cec5e246b6f6454f))
* add env openapi default value ([685d050](https://github.com/msgbyte/tianji/commit/685d05074b9a994081eade85cceb5f3b001c74df))
* add feed event url ([ac930cd](https://github.com/msgbyte/tianji/commit/ac930cd05e19e69e5ec9a7b059e56043685426ee))
* add preview text ([3d9b67a](https://github.com/msgbyte/tianji/commit/3d9b67a430536d04adaab035e29bb21d4f2b0051))
* add simple virtual list ([b7670da](https://github.com/msgbyte/tianji/commit/b7670da7db231d7f46f0cafc4ed30c2d46981c0a))
* change create feed event to local ([ab179e9](https://github.com/msgbyte/tianji/commit/ab179e9af6f2f17f2ac93be8e046a71b67f90eb1))
* change feed channel notifyFrequency type to enum ([2ce5597](https://github.com/msgbyte/tianji/commit/2ce5597dfe1c51cbec86c13b1b6a3fe5eecf2e53))
* change push message in github event ([1d4aecf](https://github.com/msgbyte/tianji/commit/1d4aecff9559e30d5274073f8c64002cce54aaef))
* fix ci problem ([865e56f](https://github.com/msgbyte/tianji/commit/865e56f40e7351d21c995f7a9c0fafbcc7b75993))
* fix ci problem ([4d15ccc](https://github.com/msgbyte/tianji/commit/4d15cccd1b8718f862a482564703eb905f1839c2))
* improve display in feed channel list ([15c6290](https://github.com/msgbyte/tianji/commit/15c6290587521abd6ce4a6325fc13456d1b10f42))
* improve feed event item display ([17f87c1](https://github.com/msgbyte/tianji/commit/17f87c191a9b1fcbcb39e73e1830ccb29b6e634c))
* improve logger and test case ([9796d42](https://github.com/msgbyte/tianji/commit/9796d428466f21adcfa42e04f04cbfe2d15aff3c))
* remove unused code ([2f6e92d](https://github.com/msgbyte/tianji/commit/2f6e92d166ac1635b87151147c12f13146136d38))
* remove unused size changer ([6ccd0ed](https://github.com/msgbyte/tianji/commit/6ccd0ede7b4c1bd8caad0697f66e61db8ea1feb9))
* skip event report if not have any events ([f814691](https://github.com/msgbyte/tianji/commit/f814691538578972bdeefe574e74a8dacb261a59))
* split integration route from feed route ([a4c31fe](https://github.com/msgbyte/tianji/commit/a4c31fe2da2b4213726579042ac93aa0547f0cc7))
* update feed guide ([c34b012](https://github.com/msgbyte/tianji/commit/c34b0124fac27fa2e48d2705cab8f07935d7fa02))
* update openapi base url and regenerate openapi document ([616a623](https://github.com/msgbyte/tianji/commit/616a623e40ea86e68595449f7a9d290630a5b116))
* update tag and content ([85a2a59](https://github.com/msgbyte/tianji/commit/85a2a598d76a5835e32772f04b6b2cf0e0d6dccf))
* update translation ([fc6ee73](https://github.com/msgbyte/tianji/commit/fc6ee733663231347a22aa7df83e4f4a454f4bd6))
* upgrade pnpm version in ci ([a2cb8b0](https://github.com/msgbyte/tianji/commit/a2cb8b0538d69d2209faa9574c509e49ec7d55ee))
* upgrade pnpm version in dockerfile ([1b89c3b](https://github.com/msgbyte/tianji/commit/1b89c3b5a808b57f1a695b86a8f35e4199e0ed7c))
* upgrade pnpm version to v9.5.0 ([63de6d7](https://github.com/msgbyte/tianji/commit/63de6d7aa514a5e1a2e206785a8426336cb323fa))

## [1.11.4](https://github.com/msgbyte/tianji/compare/v1.11.3...v1.11.4) (2024-06-21)


### Features

* add server install script usage guide ([4943d2d](https://github.com/msgbyte/tianji/commit/4943d2dd8e4495f3e03631d7f332b9a630e79b49))
* add webhook notification ([90df8e8](https://github.com/msgbyte/tianji/commit/90df8e8e36c618868110c3b9a0119b1b69184546))
* webhook add title and time ([a91d1ff](https://github.com/msgbyte/tianji/commit/a91d1ffffe41b61b9792d92865e8d8f65db27b0f))


### Document

* add document about server status page custom domain ([f06e788](https://github.com/msgbyte/tianji/commit/f06e788f454df877d7030e603aff5b882fcf7a82))
* add webhook document ([61c1b0e](https://github.com/msgbyte/tianji/commit/61c1b0e06504fca8fc35c41a7bb15130e7c08f24))
* update changelog ([ee16e6c](https://github.com/msgbyte/tianji/commit/ee16e6cd76c9138ce343b208f6c8d0026f0ee6c9))
* update wechat qrcode ([0d2c4f9](https://github.com/msgbyte/tianji/commit/0d2c4f97f96494a4874c4b3a30bd633202f35b2f))


### Others

* update release it ([3bfd11a](https://github.com/msgbyte/tianji/commit/3bfd11a7b6b2395cbe24653fea52c415c14bc1ca))

## [1.11.3](https://github.com/msgbyte/tianji/compare/tianji-0.1.17...1.11.3) (2024-06-15)


### Bug Fixes

* fix setting page not display correct problem ([fdce6b4](https://github.com/msgbyte/tianji/commit/fdce6b42f1e9817dba76072adaf732040bf3f8d3))


### Document

* [#68](https://github.com/msgbyte/tianji/issues/68) add document to how to install with helm ([95a8e99](https://github.com/msgbyte/tianji/commit/95a8e9968ba72f6e13db227c0b5695f6d12e388a))
* add improve monitor reporter usage roadmap [#75](https://github.com/msgbyte/tianji/issues/75) ([caab72d](https://github.com/msgbyte/tianji/commit/caab72dac58f2f6131d195f3bdbb29e41fa8bb0f))
* update changelog ([0deec1f](https://github.com/msgbyte/tianji/commit/0deec1fc55e30dcb1a71f835ba51b48b46310e3d))


### Others

* improve mobile display for tianji ([e9a1b61](https://github.com/msgbyte/tianji/commit/e9a1b61a7f3eec1050df9cf7e4ad3644f787091b))
* improve sidebar hide logic ([cae0c1d](https://github.com/msgbyte/tianji/commit/cae0c1d6c094a1662e1e390962ed10b8eabe73ea))
* update cr config ([f91110b](https://github.com/msgbyte/tianji/commit/f91110b313fb7f874813d2f76919476a4cf24631))

## [1.11.2](https://github.com/msgbyte/tianji/compare/v1.11.1...v1.11.2) (2024-06-07)


### Features

* add createdAt field in survey download csv ([618aedf](https://github.com/msgbyte/tianji/commit/618aedf1963559c07af696fb3483d4c073ba7c29))
* add document entry ([ad4b67c](https://github.com/msgbyte/tianji/commit/ad4b67ca459837cabcb1f274c7e10ec03bf128f5))
* add website view count in website list ([8ac5b11](https://github.com/msgbyte/tianji/commit/8ac5b11d4962de05cefe3d5be7c014f4f8bb7c9a))


### Document

* add install script uninstall document ([bffb9d6](https://github.com/msgbyte/tianji/commit/bffb9d6729adba7fd66468e9a618b68c68d09366))
* add prepare markdown ([98a8878](https://github.com/msgbyte/tianji/commit/98a887825f5df8385dc14c45e7e8ce2bc49c4b87))
* update changelog ([0c5c993](https://github.com/msgbyte/tianji/commit/0c5c993236ba51dfb0242af01459f4024e2038a6))
* update environment document ([52a8927](https://github.com/msgbyte/tianji/commit/52a89276c8ef707e5283161336296c3f040354d2))
* update manual document ([1dafea6](https://github.com/msgbyte/tianji/commit/1dafea61c78e01ed28e665ee9048afde433415a9))
* update manual install document [#56](https://github.com/msgbyte/tianji/issues/56) ([154b8b4](https://github.com/msgbyte/tianji/commit/154b8b4b6405c721342a681f366d3914536dc62a))
* update manual install faq ([4564347](https://github.com/msgbyte/tianji/commit/45643476985f65e730c4906a719a3931849cd9bb))
* update readme roadmap ([58445f9](https://github.com/msgbyte/tianji/commit/58445f9249eb8785003d381cc4527835edba485c))
* update wechat qrcode ([26da461](https://github.com/msgbyte/tianji/commit/26da4613683394bb628f9af444bf0f620d4b563a))


### Others

* increase timeout factor of interval ([4e8d761](https://github.com/msgbyte/tianji/commit/4e8d7613a40ba20e425caa2308846f663029ffe2))
* remove unused code ([328a4e8](https://github.com/msgbyte/tianji/commit/328a4e856cee0cf38c0beb1611ac2bc643bbd981))
* update env example ([80713e0](https://github.com/msgbyte/tianji/commit/80713e0fceac5ab07045532cd5759ff3a54522db))
* update sdk publish file module type ([ed0c2e9](https://github.com/msgbyte/tianji/commit/ed0c2e9d1da882acaa55854229336aa05476fd06))
* update translation ([d74ba8d](https://github.com/msgbyte/tianji/commit/d74ba8d283cb804cd7947ffc3804608ef24c41f7))
* upgrade prisma version to 5.14.0 ([a0ab1da](https://github.com/msgbyte/tianji/commit/a0ab1da6b60b3c608fb72b24f36b80e6ef954fe9))

## [1.11.1](https://github.com/msgbyte/tianji/compare/v1.11.0...v1.11.1) (2024-05-21)


### Bug Fixes

* fix display problem in docker panel ([e3d0555](https://github.com/msgbyte/tianji/commit/e3d0555c454cf7e49a9301a28f65cf863fc50573))


### Others

* add survey add state ([3ecd7aa](https://github.com/msgbyte/tianji/commit/3ecd7aa171f7be0b8c7dfdeff7d140294d8819bc))

## [1.11.0](https://github.com/msgbyte/tianji/compare/v1.10.0...v1.11.0) (2024-05-20)


### Features

* add reporter send docker info ([1dfa24d](https://github.com/msgbyte/tianji/commit/1dfa24df1b52544bee134cc6dcc94f744026bc03))
* add server docker expend view ([c6433f3](https://github.com/msgbyte/tianji/commit/c6433f310b821b4e8b3cb55df1e9ccadda7d97f4))


### Document

* new homepage ([a20396a](https://github.com/msgbyte/tianji/commit/a20396ad97cec9a54461411e8e79af9fc6571c6b))
* update website style ([8e96c06](https://github.com/msgbyte/tianji/commit/8e96c06d94b71c74235769eb5ff691c951cc2064))
* uprade docs website to v3.3.2 ([eacf7fc](https://github.com/msgbyte/tianji/commit/eacf7fc56f2f23b301470eca51747d52fe1d78e4))


### Others

* add loading state for common list ([00d40c8](https://github.com/msgbyte/tianji/commit/00d40c8410c0c7c94438518344cd7c946cc64879))
* change datatable expend icon and add transition ([74bd9ef](https://github.com/msgbyte/tianji/commit/74bd9ef3d96c1f2940c0717b61466edc7d0b44ca))
* move dependency place ([dec6a8b](https://github.com/msgbyte/tianji/commit/dec6a8b7c59deac561e68abed46334e7a072f8c5))
* update survey icon ([0ea7515](https://github.com/msgbyte/tianji/commit/0ea7515ad21e8d4e3fd798bf3e1341f0caf56821))
* upgrade tianji-client-sdk version ([9a0a1ea](https://github.com/msgbyte/tianji/commit/9a0a1eacb693dd816ee68db2e217f8f6e48528c6))
* upgrade trpc version to 10.45.2 ([7c94caf](https://github.com/msgbyte/tianji/commit/7c94caf0ed777f9558bbdc84c26eba32d60105a1))

## [1.10.0](https://github.com/msgbyte/tianji/compare/v1.9.4...v1.10.0) (2024-05-15)


### Features

* [#62](https://github.com/msgbyte/tianji/issues/62) add title section in website ([d5895dc](https://github.com/msgbyte/tianji/commit/d5895dc4a9d9d161fd17ebeb7d55b0304101b3aa))
* add survey backend endpoint ([2764262](https://github.com/msgbyte/tianji/commit/27642625ac9612ceeb1329d0aa3db8004af87844))
* add survey command panel ([c9bf016](https://github.com/msgbyte/tianji/commit/c9bf016fbf0c7216aa944118efda6b6f0acde350))
* add survey delete action ([12cd54e](https://github.com/msgbyte/tianji/commit/12cd54eafe63446471b0366d18cdaaea4ac95532))
* add survey download feature ([eebf00f](https://github.com/msgbyte/tianji/commit/eebf00f882cd8906aff2316936da9b2496018a53))
* add survey usage button ([2b75a8e](https://github.com/msgbyte/tianji/commit/2b75a8edad4285c524846438c79acfae7b013923))
* add tianji event for pricing page ([6606b25](https://github.com/msgbyte/tianji/commit/6606b253d84da09e1d821c00bd97bd7b2abf7452))
* add tianji-client-react package and useTianjiSurvey hooks which can easy to get survey info ([0fc112f](https://github.com/msgbyte/tianji/commit/0fc112fc329f0364914044f6f2727765307023ef))
* add website pricing page ([6674c19](https://github.com/msgbyte/tianji/commit/6674c19e87d3a628a2a305f9d5db48e365189b0c))
* survey basic fe framework and add new form ([010fd00](https://github.com/msgbyte/tianji/commit/010fd00be348cb5de0207cf1aea58fb43117130a))
* survey detail and edit ([a596011](https://github.com/msgbyte/tianji/commit/a596011960db230a8241e4f59bac5d33597cdc9a))
* survey sdk and openapi client ([f7f191a](https://github.com/msgbyte/tianji/commit/f7f191a53da03334b8b08844c7c51b19727828d1))


### Document

* Add one-click deploy on sealos ([#64](https://github.com/msgbyte/tianji/issues/64)) ([fc79c57](https://github.com/msgbyte/tianji/commit/fc79c5758817d95b1058e4c0093c88b262973d52))
* clear email input when submit success in price page ([3d16d8e](https://github.com/msgbyte/tianji/commit/3d16d8edd8c89fd3d553ad461a5ae383862b80fb))
* reduce homepage image size to improve user network ([6865a7c](https://github.com/msgbyte/tianji/commit/6865a7ca0bae30f017837a5e54a171be8ce6d85a))
* update custom script document ([7d370b4](https://github.com/msgbyte/tianji/commit/7d370b4fc51a52ee91b2d94afcc9d2367fcc5fbb))
* update qrcode ([ebb6c51](https://github.com/msgbyte/tianji/commit/ebb6c51f81d75b2736213403772f5418e778224e))


### Others

* add tooltip and time display on table ([9d3c034](https://github.com/msgbyte/tianji/commit/9d3c0344eee7b4309fad2e7ab827090136541d51))
* change weight of commit list search ([cc0bd73](https://github.com/msgbyte/tianji/commit/cc0bd73ed1c48c1fed0da95fcfc2890d1cd73012))
* change word: Countries -> Country or Region ([1ad9aa9](https://github.com/msgbyte/tianji/commit/1ad9aa95f9886342a6771cd6501d448f7801916e))
* common list add loading state ([9780aff](https://github.com/msgbyte/tianji/commit/9780affebca31f709d4f8f20e6c8f2593f1b198a))
* define survey model ([9143cc4](https://github.com/msgbyte/tianji/commit/9143cc468cd15d83b5419521adc9834576488b56))
* improve mobile display ([b2fb183](https://github.com/msgbyte/tianji/commit/b2fb1832e1a2573c7e5ad8abc38a937e4e63d1a1))
* improve mobile layout navbar display if have much features ([fd9108e](https://github.com/msgbyte/tianji/commit/fd9108e77fd8c0f4db5840512f1f0e9a73bce4d3))
* remove unused code ([342c076](https://github.com/msgbyte/tianji/commit/342c076966dcd2ede5341067a069743c09b967d1))
* update jwt secret generator more safe for user ([6e8c280](https://github.com/msgbyte/tianji/commit/6e8c28026e890774ce3edb49febde1f606aa0aee))

## [1.9.4](https://github.com/msgbyte/tianji/compare/v1.9.3...v1.9.4) (2024-05-06)


### Features

* add add page selected state for add button in sidebar header ([d31d203](https://github.com/msgbyte/tianji/commit/d31d20364ef214de9f4e1c9f864303c7d440a63c))
* add cronjob for send https certificate expired notification ([7b95c55](https://github.com/msgbyte/tianji/commit/7b95c55a70c290eba4bef464589fc406536b0354))
* add feishu notification ([f6fc210](https://github.com/msgbyte/tianji/commit/f6fc210b65948fe19e4166ed99f083ddda3a1282))
* monitor add trending mode ([d77e132](https://github.com/msgbyte/tianji/commit/d77e1321f43c034434564d3d1d090b8713df963a))


### Bug Fixes

* [#61](https://github.com/msgbyte/tianji/issues/61) fix font family problem ([b4872a4](https://github.com/msgbyte/tianji/commit/b4872a47e7144178cb9357b4777f01913f7d18e4))
* fix status page markdown editor preview cannot render correct problem ([eccb322](https://github.com/msgbyte/tianji/commit/eccb322ead49a09458b5961377be99392c44aa83))


### Document

* add example of docker pull image size ([4761c2d](https://github.com/msgbyte/tianji/commit/4761c2dd20e354f649ed2e5ebfce80870e535120))
* adding one-click deploy buttons to README.md ([#60](https://github.com/msgbyte/tianji/issues/60)) ([7cfafe4](https://github.com/msgbyte/tianji/commit/7cfafe49d792cf7884d7919def46fe30f3b36d20))
* update release date of version 1.7.0 ([755aeaf](https://github.com/msgbyte/tianji/commit/755aeafa23d91c3bedc02a18b284f002e72d749b))


### Others

* add docker canary image version display ([dc4d88f](https://github.com/msgbyte/tianji/commit/dc4d88fc4731d3e81ef38c078bd71abc8731bc1e))
* fix ci problem ([18f3073](https://github.com/msgbyte/tianji/commit/18f3073e94b314da086cb6fe8d617781200de7ca))
* improve server list update at display ([51675f6](https://github.com/msgbyte/tianji/commit/51675f6129752ccdbf1e987b2228043333c9af11))
* improve TLS chain fetch way, to make sure can get tls info correct ([cc910b7](https://github.com/msgbyte/tianji/commit/cc910b7ee67f151fa92944f10c3b1e365bc74cb3))
* update translation ([e4b0150](https://github.com/msgbyte/tianji/commit/e4b01502bcad94d96b7ee5e8fe9a693a6a944cda))

## [1.9.3](https://github.com/msgbyte/tianji/compare/v1.9.2...v1.9.3) (2024-05-01)


### Features

* add markdown editor for page description ([7e1faf8](https://github.com/msgbyte/tianji/commit/7e1faf82588d4a3ca8cd3423a9df2b779053eeac))


### Others

* add server page reconnect ([c950e4a](https://github.com/msgbyte/tianji/commit/c950e4a3f8fc45a73c70079813658302ee364aee))
* update Polish translation ([#59](https://github.com/msgbyte/tianji/issues/59)) ([dd8ea66](https://github.com/msgbyte/tianji/commit/dd8ea6623fa5bb5631eb00d8c79c2e9ebbc82e1d))

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
