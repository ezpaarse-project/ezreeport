# ezreeport-worker-v1.0.0-beta.1 (2025-07-17)


### Bug Fixes

* better message acknowledgements ([f0e90b8](https://github.com/ezpaarse-project/ezreeport/commit/f0e90b847a38de2a78b5677ec4891636e309d4cd))
* crash fixes for rpc and workers ([45ee456](https://github.com/ezpaarse-project/ezreeport/commit/45ee4569a0e00e839cc1c9ae887f46db3620c9b2))
* fix crash when trying to send first heartbeat ([e6c6910](https://github.com/ezpaarse-project/ezreeport/commit/e6c6910ddf04756e34312c3e4335864b6688db17))
* fixed env vars ([568857f](https://github.com/ezpaarse-project/ezreeport/commit/568857f51df9b7bc859692c065e714f0e9521bda))
* fixed loggers ([f30fb7a](https://github.com/ezpaarse-project/ezreeport/commit/f30fb7a2ea2ba25b0237b46bed24cf893de9157d))
* fixed order of init ([fe3188d](https://github.com/ezpaarse-project/ezreeport/commit/fe3188da0d5097c7fb7c9f7c2f6464a5c50a8cd0))
* **worker:** added log line when starting ([73d71c0](https://github.com/ezpaarse-project/ezreeport/commit/73d71c0383e3ddd9602f532c57df87a9724134eb))
* **worker:** fixed error logs when fetching ([625a6b3](https://github.com/ezpaarse-project/ezreeport/commit/625a6b39904785c3616b936d0f34fa5c05a13dce))


### Features

* added "files" service to handle IO ([4d9f9f3](https://github.com/ezpaarse-project/ezreeport/commit/4d9f9f3fc20d98cf9e913f0b32c96b525a1a4a7e))
* added filesystem support for heartbeat ([6f50403](https://github.com/ezpaarse-project/ezreeport/commit/6f50403706bfaf2105978885c12fa531f29ad03c))
* added reportId to generations ([dd81994](https://github.com/ezpaarse-project/ezreeport/commit/dd81994b80e23590adead0e98f8ea7db83fd8518))
* can now send a RPC request to all nodes ([88ffe30](https://github.com/ezpaarse-project/ezreeport/commit/88ffe30e3dd09e3bd27bea4fe5d1751c4cc2b5f2))
* exit service if config changes ([cc5414d](https://github.com/ezpaarse-project/ezreeport/commit/cc5414d282742baac3d84e5a34d8ecbc723ee9b6))
* **files:** added taskId to report list ([9cc347a](https://github.com/ezpaarse-project/ezreeport/commit/9cc347a2697ff839045a96947bdd5567fd356260))
* revamped errors in report generation ([721d0c1](https://github.com/ezpaarse-project/ezreeport/commit/721d0c11ebaf62946bf9252f19eba8ce32240e70))
* using rabbitmq shorthands everywhere ([481c8a6](https://github.com/ezpaarse-project/ezreeport/commit/481c8a6f04eae389c0bc32927015e5ec6029c571))
* **worker:** added dead lettering for generations ([b11eaba](https://github.com/ezpaarse-project/ezreeport/commit/b11eabac70a515f1ad437c6a7a74d3f1b0237428))
* **worker:** copied generation logic outside of api ([717b1f3](https://github.com/ezpaarse-project/ezreeport/commit/717b1f310617ab3b51e0d5494cba0139586267f5))
* **worker:** resilient rabbitmq + heartbeat ([2516c78](https://github.com/ezpaarse-project/ezreeport/commit/2516c78da6e259a99971c352786c72be3dd9febb))
* **worker:** use files service to write generated reports ([9835578](https://github.com/ezpaarse-project/ezreeport/commit/98355785cf28ec62e189130bfb2ad0928b8663e6))


### Performance Improvements

* **worker:** simplified elastic filters ([29fd42a](https://github.com/ezpaarse-project/ezreeport/commit/29fd42a4fa5735e6b8bd091f31c3ecde812a5df5))
