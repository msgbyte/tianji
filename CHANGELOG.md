

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
