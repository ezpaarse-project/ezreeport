# [ezreeport-mail-v1.4.0-beta.1](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-mail@1.3.0...ezreeport-mail@1.4.0-beta.1) (2025-07-17)


### Bug Fixes

* better message acknowledgements ([f0e90b8](https://github.com/ezpaarse-project/ezreeport/commit/f0e90b847a38de2a78b5677ec4891636e309d4cd))
* fix crash when trying to send first heartbeat ([e6c6910](https://github.com/ezpaarse-project/ezreeport/commit/e6c6910ddf04756e34312c3e4335864b6688db17))
* fixed env vars ([568857f](https://github.com/ezpaarse-project/ezreeport/commit/568857f51df9b7bc859692c065e714f0e9521bda))
* fixed loggers ([f30fb7a](https://github.com/ezpaarse-project/ezreeport/commit/f30fb7a2ea2ba25b0237b46bed24cf893de9157d))
* fixed order of init ([fe3188d](https://github.com/ezpaarse-project/ezreeport/commit/fe3188da0d5097c7fb7c9f7c2f6464a5c50a8cd0))


### Features

* added "files" service to handle IO ([4d9f9f3](https://github.com/ezpaarse-project/ezreeport/commit/4d9f9f3fc20d98cf9e913f0b32c96b525a1a4a7e))
* added filesystem support for heartbeat ([6f50403](https://github.com/ezpaarse-project/ezreeport/commit/6f50403706bfaf2105978885c12fa531f29ad03c))
* can now send a RPC request to all nodes ([88ffe30](https://github.com/ezpaarse-project/ezreeport/commit/88ffe30e3dd09e3bd27bea4fe5d1751c4cc2b5f2))
* exit service if config changes ([cc5414d](https://github.com/ezpaarse-project/ezreeport/commit/cc5414d282742baac3d84e5a34d8ecbc723ee9b6))
* **files:** added taskId to report list ([9cc347a](https://github.com/ezpaarse-project/ezreeport/commit/9cc347a2697ff839045a96947bdd5567fd356260))
* **mail:** added compression of files ([6225386](https://github.com/ezpaarse-project/ezreeport/commit/6225386fff1ab1a15673542dd8dd33a2c1c0aa83))
* **mail:** gracefully stops http server ([64f9a5a](https://github.com/ezpaarse-project/ezreeport/commit/64f9a5a4b9fe2670eff36f1d17ae104a4656b910))
* **mail:** resilient rabbitmq + heartbeat ([e554677](https://github.com/ezpaarse-project/ezreeport/commit/e55467710ecb088697d761a10c8ab28789a11de2))
* **mail:** use files service to send generated reports ([95e78f4](https://github.com/ezpaarse-project/ezreeport/commit/95e78f4a728d598e1aa023e8be17b26ccfbaa792))
* **mail:** using rabbitmq to send generated reports ([c4c3255](https://github.com/ezpaarse-project/ezreeport/commit/c4c32557e9127fda45bd30a8c4d4ba3602906732))
* revamped errors in report generation ([721d0c1](https://github.com/ezpaarse-project/ezreeport/commit/721d0c11ebaf62946bf9252f19eba8ce32240e70))
* using rabbitmq shorthands everywhere ([481c8a6](https://github.com/ezpaarse-project/ezreeport/commit/481c8a6f04eae389c0bc32927015e5ec6029c571))

# [ezreeport-mail-v1.3.0](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-mail@1.2.2...ezreeport-mail@1.3.0) (2025-03-06)


### Bug Fixes

* fixed logs not being present in file ([7aef235](https://github.com/ezpaarse-project/ezreeport/commit/7aef2359eee8d6a9df33cf5c99f58da93ff79261))
* **mail:** fixed common type between mail and report ([6186c51](https://github.com/ezpaarse-project/ezreeport/commit/6186c510dafc22b5c36dde009b56ae5c833469ea))
* **mail:** fixed issue where pino-pretty could be required but not installed ([7546a5a](https://github.com/ezpaarse-project/ezreeport/commit/7546a5ad66b2d4c9eb239e9f863b179ad857ff2c))
* **mail:** fixed mail http listenting address ([e77519d](https://github.com/ezpaarse-project/ezreeport/commit/e77519d11ced7c6657268c9e06ae6f9f8913391d))
* **mail:** following report changes ([a0fa03c](https://github.com/ezpaarse-project/ezreeport/commit/a0fa03c522af11be62abe56b75863991a9915ad3))
* minor fixs on loggers and task validation ([90eda76](https://github.com/ezpaarse-project/ezreeport/commit/90eda7646b16ab223b4b31519f0d3d1cb11eafb6))


### Features

* **mail:** added jsonl logs in production ([c56f607](https://github.com/ezpaarse-project/ezreeport/commit/c56f6074b375b5ef6d7f5314ef272fd11046587a))
* **mail:** added period to success reports ([133a671](https://github.com/ezpaarse-project/ezreeport/commit/133a6715f2915375c94ab0db553c969287d51333))
* **mail:** added routes for kube probes ([7b8de88](https://github.com/ezpaarse-project/ezreeport/commit/7b8de882b6a0ce44b834fd0126cf0ffc5db87d14))
* **mail:** updated error report with more information ([7935ef4](https://github.com/ezpaarse-project/ezreeport/commit/7935ef4c082f766a774a586c9974f20ff6211244))

# [ezreeport-mail-v1.3.0-rc.2](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-mail@1.3.0-rc.1...ezreeport-mail@1.3.0-rc.2) (2025-03-06)


### Bug Fixes

* **mail:** fixed mail http listenting address ([e77519d](https://github.com/ezpaarse-project/ezreeport/commit/e77519d11ced7c6657268c9e06ae6f9f8913391d))

# [ezreeport-mail-v1.3.0-rc.1](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-mail@1.2.2...ezreeport-mail@1.3.0-rc.1) (2025-02-07)


### Bug Fixes

* fixed logs not being present in file ([7aef235](https://github.com/ezpaarse-project/ezreeport/commit/7aef2359eee8d6a9df33cf5c99f58da93ff79261))
* **mail:** fixed common type between mail and report ([6186c51](https://github.com/ezpaarse-project/ezreeport/commit/6186c510dafc22b5c36dde009b56ae5c833469ea))
* **mail:** fixed issue where pino-pretty could be required but not installed ([7546a5a](https://github.com/ezpaarse-project/ezreeport/commit/7546a5ad66b2d4c9eb239e9f863b179ad857ff2c))
* **mail:** following report changes ([a0fa03c](https://github.com/ezpaarse-project/ezreeport/commit/a0fa03c522af11be62abe56b75863991a9915ad3))
* minor fixs on loggers and task validation ([90eda76](https://github.com/ezpaarse-project/ezreeport/commit/90eda7646b16ab223b4b31519f0d3d1cb11eafb6))


### Features

* **mail:** added jsonl logs in production ([c56f607](https://github.com/ezpaarse-project/ezreeport/commit/c56f6074b375b5ef6d7f5314ef272fd11046587a))
* **mail:** added period to success reports ([133a671](https://github.com/ezpaarse-project/ezreeport/commit/133a6715f2915375c94ab0db553c969287d51333))
* **mail:** added routes for kube probes ([7b8de88](https://github.com/ezpaarse-project/ezreeport/commit/7b8de882b6a0ce44b834fd0126cf0ffc5db87d14))
* **mail:** updated error report with more information ([7935ef4](https://github.com/ezpaarse-project/ezreeport/commit/7935ef4c082f766a774a586c9974f20ff6211244))

# [ezreeport-mail-v1.3.0-beta.3](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-mail@1.3.0-beta.2...ezreeport-mail@1.3.0-beta.3) (2025-02-07)


### Features

* **mail:** added period to success reports ([133a671](https://github.com/ezpaarse-project/ezreeport/commit/133a6715f2915375c94ab0db553c969287d51333))
* **mail:** updated error report with more information ([7935ef4](https://github.com/ezpaarse-project/ezreeport/commit/7935ef4c082f766a774a586c9974f20ff6211244))

# [ezreeport-mail-v1.3.0-beta.2](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-mail@1.3.0-beta.1...ezreeport-mail@1.3.0-beta.2) (2025-01-22)


### Bug Fixes

* **mail:** fixed issue where pino-pretty could be required but not installed ([7546a5a](https://github.com/ezpaarse-project/ezreeport/commit/7546a5ad66b2d4c9eb239e9f863b179ad857ff2c))

# [ezreeport-mail-v1.3.0-beta.1](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-mail@1.2.2...ezreeport-mail@1.3.0-beta.1) (2025-01-07)


### Bug Fixes

* fixed logs not being present in file ([7aef235](https://github.com/ezpaarse-project/ezreeport/commit/7aef2359eee8d6a9df33cf5c99f58da93ff79261))
* **mail:** fixed common type between mail and report ([6186c51](https://github.com/ezpaarse-project/ezreeport/commit/6186c510dafc22b5c36dde009b56ae5c833469ea))
* **mail:** following report changes ([a0fa03c](https://github.com/ezpaarse-project/ezreeport/commit/a0fa03c522af11be62abe56b75863991a9915ad3))
* minor fixs on loggers and task validation ([90eda76](https://github.com/ezpaarse-project/ezreeport/commit/90eda7646b16ab223b4b31519f0d3d1cb11eafb6))


### Features

* **mail:** added jsonl logs in production ([c56f607](https://github.com/ezpaarse-project/ezreeport/commit/c56f6074b375b5ef6d7f5314ef272fd11046587a))
* **mail:** added routes for kube probes ([7b8de88](https://github.com/ezpaarse-project/ezreeport/commit/7b8de882b6a0ce44b834fd0126cf0ffc5db87d14))

# [ezreeport-mail-v1.2.2](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-mail@1.2.1...ezreeport-mail@1.2.2) (2024-08-14)


### Bug Fixes

* **mail:** fixed issue with paths when attaching images of template ([b432c52](https://github.com/ezpaarse-project/ezreeport/commit/b432c52b47f0f37dcd06b1a8d87c3406a074517a))

# [ezreeport-mail-v1.2.1](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-mail@1.2.0...ezreeport-mail@1.2.1) (2024-08-09)


### Bug Fixes

* **mail:** removed UTC mention ([d6b4c3c](https://github.com/ezpaarse-project/ezreeport/commit/d6b4c3ced73a3592752915a3f679f0ec0c991829))

# [1.2.0](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-mail@1.1.0...ezreeport-mail@1.2.0) (2024-06-14)


### Bug Fixes

* **mail:** fixed element position in layout ([3b9eefc](https://github.com/ezpaarse-project/ezreeport/commit/3b9eefc2bd4398e371b97d7e88e0d94f3494710e))
* **mail:** upgraded timeout of pings cause of inist's smtp ([c5c0113](https://github.com/ezpaarse-project/ezreeport/commit/c5c01137317da00b9fd6eb7f75c8b5a73ed2d371))

### Features

* **mail:** updated assets and theme ([125b552](https://github.com/ezpaarse-project/ezreeport/commit/125b552995fc845d83917d599fb5cee9a5e2808f))

# [1.1.0](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-mail@1.0.0...ezreeport-mail@1.1.0) (2024-04-22)


### Bug Fixes

* fixed types of healthchecks ([dbc3df6](https://github.com/ezpaarse-project/ezreeport/commit/dbc3df62a8cd553ae898c4f59171e7b27de3d48e))
* **mail:** fixed no logs when error in http server ([02fc944](https://github.com/ezpaarse-project/ezreeport/commit/02fc944487d329c0842a5c105fc4d7dfc4338548))
* **mail:** fixed port shown in logs ([126d29f](https://github.com/ezpaarse-project/ezreeport/commit/126d29fd68e7fcc2e40c534408f6f15766d1f093))


### Features

* **mail:** added healthchecks to mail service ([ca23282](https://github.com/ezpaarse-project/ezreeport/commit/ca23282dfaa90c1186173eb1f98ec04d6ba43273))
* **mail:** added namespace in mails ([4fea5cb](https://github.com/ezpaarse-project/ezreeport/commit/4fea5cb184e16bfe7200b56830ad92c18832b25d))

# ezreeport-mail 1.0.0 (2024-02-16)


### Bug Fixes

* **mail:** added timezone to mails ([69563e3](https://github.com/ezpaarse-project/ezreeport/commit/69563e3b152b6bfa1077e8f0252a3e2026db9186))
* **mail:** fixed concurrence in bull queues ([ff29377](https://github.com/ezpaarse-project/ezreeport/commit/ff2937700dc7c82b1fcfa4ddf6109919890d716b))
* **mail:** fixed env not overriding mail config ([8ad5c5f](https://github.com/ezpaarse-project/ezreeport/commit/8ad5c5f4fcd70072f1442ecfb717b8818dd11fd3))
* **mail:** fixed mail attachements ([51135b7](https://github.com/ezpaarse-project/ezreeport/commit/51135b7dd3a2fbc2eb10b5683effb269afade5c7))
* **mail:** fixed mail sending ([fa3a0c6](https://github.com/ezpaarse-project/ezreeport/commit/fa3a0c6241b30ee1a01bce616bf1a73624e8acc7))
* **mail:** trying to fix inline attachements visiblity ([dc7c378](https://github.com/ezpaarse-project/ezreeport/commit/dc7c37890e0639c9e316e51466caba776bf1ca8e))
* prefixed bull queue names to avoid conflicts with ezMesure ([cf87587](https://github.com/ezpaarse-project/ezreeport/commit/cf875879a01638948b31619a1360df0ec91c83dd))

### Features

* **mail:** added SMTP ping on startup ([23d5ffb](https://github.com/ezpaarse-project/ezreeport/commit/23d5ffbbce831c9e8ed436b79778003e821ec931))
