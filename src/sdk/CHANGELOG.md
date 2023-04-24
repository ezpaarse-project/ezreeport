# ezreeport-sdk-js [1.0.0-beta.3](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-sdk-js@1.0.0-beta.2...ezreeport-sdk-js@1.0.0-beta.3) (2023-04-24)


### Bug Fixes

* **sdk:** fixed export of crons methods ([46d1dbc](https://github.com/ezpaarse-project/ezreeport/commit/46d1dbc081a1c2206c2a63737088c4627990f7ca))
* **sdk:** fixed export of reccurence ([7d88766](https://github.com/ezpaarse-project/ezreeport/commit/7d8876676256de55766b4724c57c5c9b27effe5e))


### Features

* **sdk:** added support for tags in template ([d9285b0](https://github.com/ezpaarse-project/ezreeport/commit/d9285b083c426b96fcc636cb0bf4ae7a0026dd99))
* **sdk:** delete no longer returns something ([743308f](https://github.com/ezpaarse-project/ezreeport/commit/743308f52e75ad329fd067c9282bbb80dbbcb42a))
* **sdk:** following reporting api changes ([4a52e7c](https://github.com/ezpaarse-project/ezreeport/commit/4a52e7c2a5ffd83f3ee2d471484d4b49115adcbb))

# ezreeport-sdk-js [1.0.0-beta.2](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-sdk-js@1.0.0-beta.1...ezreeport-sdk-js@1.0.0-beta.2) (2023-04-04)


### Bug Fixes

* **sdk:** fixed namespace in task in history ([a992199](https://github.com/ezpaarse-project/ezreeport/commit/a992199ecb4c2748112fe928ba93f5e9a6e8a4df))
* **sdk:** fixed wrong name for updating template ([b75dad6](https://github.com/ezpaarse-project/ezreeport/commit/b75dad69899df59cefeac246e33f9243307cf200))
* **sdk:** updating auth module following API ([947084d](https://github.com/ezpaarse-project/ezreeport/commit/947084d8827c41c2ec4fbb3ff64eaf24a5bd9fd5))


### Features

* **sdk:** added template management ([e67ae37](https://github.com/ezpaarse-project/ezreeport/commit/e67ae37a3524ba4490bc328b7939926537dbd811))
* **sdk:** using namespaces instead of institutions, following API ([9950309](https://github.com/ezpaarse-project/ezreeport/commit/99503094c972aede02c18677b3c81e718d820214))
* **vue:** switched to the new permission system ([a0a59a0](https://github.com/ezpaarse-project/ezreeport/commit/a0a59a050a216f1ca4a17060fb57395deb5c443a))


### BREAKING CHANGES

* **sdk:** institution parameter is now an array of strings
* **sdk:** institution module is dropped

# ezreeport-sdk-js 1.0.0-beta.1 (2023-02-24)


### Bug Fixes

* **sdk:** fix type on getAllTemplates ([4309030](https://github.com/ezpaarse-project/ezreeport/commit/4309030938b47d7289a72736b84d99540bd40784))
* **sdk:** fixed type of InputTask ([3feaade](https://github.com/ezpaarse-project/ezreeport/commit/3feaade67d014cf24a47d222af0a4a284a0c466f))
* **sdk:** fixed type of paginated data ([7113f7d](https://github.com/ezpaarse-project/ezreeport/commit/7113f7d42d2f0e98f351202d8efcc47126f7c0e3))
* **sdk:** fixed type on figures ([74e3467](https://github.com/ezpaarse-project/ezreeport/commit/74e3467b3edb2a698ccb460a9da4b32760b0c5d8))
* **sdk:** fixed types by replacing objects with json values ([ae1a501](https://github.com/ezpaarse-project/ezreeport/commit/ae1a50192531308aa097cd3f7f2c8218cc2c880d))
* **sdk:** fixed types on report ([89542e1](https://github.com/ezpaarse-project/ezreeport/commit/89542e1c547dbbfa67f4685020e55a18c9b0bb14))
* **vue:** fixed generation permissions ([afbeea2](https://github.com/ezpaarse-project/ezreeport/commit/afbeea21c38da0d2fe7686f0b88666b4abcf3bde))


### Features

* **sdk:** added list of user's available institution ([80412de](https://github.com/ezpaarse-project/ezreeport/commit/80412de76f1f01f1f1692f17070cf24709cc8d40))
* **sdk:** added support for responseType with reports ([4997076](https://github.com/ezpaarse-project/ezreeport/commit/4997076b67722fd256c7cd0e9c8fc8e9c44144a1))
* **sdk:** can retrieve version ([e0eea2c](https://github.com/ezpaarse-project/ezreeport/commit/e0eea2ca07c3854e597f84eb534b43969f451fc8))
* **sdk:** following api changes about queues ([d49fd3f](https://github.com/ezpaarse-project/ezreeport/commit/d49fd3f99243186cdc697f8f026af565dc569bad))
* **sdk:** moved institutions to dedicated modules ([4e81396](https://github.com/ezpaarse-project/ezreeport/commit/4e813967ab1faff1f26728878e25a456600e9054))
* **sdk:** task is now included in history list ([d094471](https://github.com/ezpaarse-project/ezreeport/commit/d094471d702cbef36f2f58fde9f3049c327a0ccc))
* **vue:** added base to work on vue plugin ([7d2dd35](https://github.com/ezpaarse-project/ezreeport/commit/7d2dd35f2c157115ccbf706860bdb9473196e9fd))
* **vue:** added global data for sdk ([f2ad20f](https://github.com/ezpaarse-project/ezreeport/commit/f2ad20f5beaf446d200ad0987cad567495fba0c8))
* **vue:** moved from `Histoire` to `Storybook` ([4f41efe](https://github.com/ezpaarse-project/ezreeport/commit/4f41efefcd75c063fbc5dbfc63f03d15c191fb6c))
