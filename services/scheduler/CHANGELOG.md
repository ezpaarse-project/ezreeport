# ezreeport-scheduler-v1.0.0-beta.1 (2025-07-17)


### Bug Fixes

* crash fixes for rpc and workers ([45ee456](https://github.com/ezpaarse-project/ezreeport/commit/45ee4569a0e00e839cc1c9ae887f46db3620c9b2))
* fix crash when trying to send first heartbeat ([e6c6910](https://github.com/ezpaarse-project/ezreeport/commit/e6c6910ddf04756e34312c3e4335864b6688db17))
* fixed env vars ([568857f](https://github.com/ezpaarse-project/ezreeport/commit/568857f51df9b7bc859692c065e714f0e9521bda))
* fixed loggers ([f30fb7a](https://github.com/ezpaarse-project/ezreeport/commit/f30fb7a2ea2ba25b0237b46bed24cf893de9157d))
* fixed order of init ([fe3188d](https://github.com/ezpaarse-project/ezreeport/commit/fe3188da0d5097c7fb7c9f7c2f6464a5c50a8cd0))
* **scheduler:** added log line when starting ([af27760](https://github.com/ezpaarse-project/ezreeport/commit/af2776090f59882375e603a58e826b991aa7afbc))
* **scheduler:** fixed issues with rpc ([b68999b](https://github.com/ezpaarse-project/ezreeport/commit/b68999b34a110317df8974e615e7809f12046c88))


### Features

* added "files" service to handle IO ([4d9f9f3](https://github.com/ezpaarse-project/ezreeport/commit/4d9f9f3fc20d98cf9e913f0b32c96b525a1a4a7e))
* added filesystem support for heartbeat ([6f50403](https://github.com/ezpaarse-project/ezreeport/commit/6f50403706bfaf2105978885c12fa531f29ad03c))
* exit service if config changes ([cc5414d](https://github.com/ezpaarse-project/ezreeport/commit/cc5414d282742baac3d84e5a34d8ecbc723ee9b6))
* files services now handle purge instead of scheduler ([93fa65f](https://github.com/ezpaarse-project/ezreeport/commit/93fa65f3f85f58b6dfc1c5798def503739f4eed4))
* **files:** added taskId to report list ([9cc347a](https://github.com/ezpaarse-project/ezreeport/commit/9cc347a2697ff839045a96947bdd5567fd356260))
* **scheduler:** added cron management ([d6bd2ed](https://github.com/ezpaarse-project/ezreeport/commit/d6bd2edaf7e46104291d3092de696384c5824669))
* **scheduler:** added db connection to scheduler ([ac5ee88](https://github.com/ezpaarse-project/ezreeport/commit/ac5ee88a1a79eb72f87a021ad1e3ab352971da04))
* **scheduler:** added dead lettering for generations ([46e949c](https://github.com/ezpaarse-project/ezreeport/commit/46e949cd184499897b7384d8c02261f03fe114af))
* **scheduler:** copied cron logic outside of api ([b5ee247](https://github.com/ezpaarse-project/ezreeport/commit/b5ee247e51b951978753fbc5635e548a4eddd29a))
* **scheduler:** now handles generation status instead of api ([42569a0](https://github.com/ezpaarse-project/ezreeport/commit/42569a09ab07aea49b0c03eb9044a828b3c1ecdc))
* **scheduler:** removed rpc api client ([1f1be86](https://github.com/ezpaarse-project/ezreeport/commit/1f1be86584bf195a189809f84efc54b7deeab377))
* **scheduler:** resilient rabbitmq + heartbeat ([029a387](https://github.com/ezpaarse-project/ezreeport/commit/029a387fa75765c29286d451f132a30a2bcf1ff7))
* sending event when adding to generation queue ([ee5cca3](https://github.com/ezpaarse-project/ezreeport/commit/ee5cca33fe6d4dec3da6e05e719096f610fa74bf))
* using rabbitmq shorthands everywhere ([481c8a6](https://github.com/ezpaarse-project/ezreeport/commit/481c8a6f04eae389c0bc32927015e5ec6029c571))
