# ezreeport-report 1.0.0-beta.1 (2023-02-24)


### Bug Fixes

* prefixed bull queue names to avoid conflicts with ezMesure ([cf87587](https://github.com/ezpaarse-project/ezreeport/commit/cf875879a01638948b31619a1360df0ec91c83dd))
* **report:** added error if no institution found ([7303eab](https://github.com/ezpaarse-project/ezreeport/commit/7303eabda6e77724b61bddda63a593638a186c2e))
* **report:** fixed concurrence in bull queues ([a849213](https://github.com/ezpaarse-project/ezreeport/commit/a849213adb788e6fe646eacd8a9bb323c9455639))
* **report:** fixed institution type ([52979a0](https://github.com/ezpaarse-project/ezreeport/commit/52979a0bebed82286bf74208fefd528eb7bde8ad))
* **report:** fixed md images fetch with proxy ([64cd331](https://github.com/ezpaarse-project/ezreeport/commit/64cd331d4764cfeb7de765179649ca58b22491be))
* **report:** fixed permissions about history ([209040b](https://github.com/ezpaarse-project/ezreeport/commit/209040bcfeb4225611acaf70b24a7cac813f8a6e))
* **report:** fixed type issue in auth middleware ([7c942fb](https://github.com/ezpaarse-project/ezreeport/commit/7c942fbb82f9bb18cd344757926fac50257fdba4))
* **report:** fixed wrong id when getting institutions ([cb8c773](https://github.com/ezpaarse-project/ezreeport/commit/cb8c773d2490c5072d66b892f2fe20a5fe06358a))
* **report:** fixed wrong origin when sending errors ([1a1bb04](https://github.com/ezpaarse-project/ezreeport/commit/1a1bb04dcd179e0312bbda805db8951eb831b128))
* **report:** omiting few field of tasks when getting history ([1fd37cd](https://github.com/ezpaarse-project/ezreeport/commit/1fd37cd1548563408a3936bf2983a767c59b858e))


### Features

* **report:** added count of tasks in pagination meta ([f5a84a7](https://github.com/ezpaarse-project/ezreeport/commit/f5a84a7dfce0dca9fbf8aaa85b288b651b424a4c))
* **report:** added history total ([3370220](https://github.com/ezpaarse-project/ezreeport/commit/33702208acaf27705d386e48cc81dc2a51aa647c))
* **report:** added list of user's available institution ([1e5767a](https://github.com/ezpaarse-project/ezreeport/commit/1e5767a1e2df9273dd4debdf88c3c15299303821))
* **report:** added more logs when creating crons ([cd83ef4](https://github.com/ezpaarse-project/ezreeport/commit/cd83ef40139785ac5a2aac31b98cb11db0bdc224))
* **report:** added restfull routes for institutions ([3ce901e](https://github.com/ezpaarse-project/ezreeport/commit/3ce901efaa2462adecbe34ffa79db4a99133c5fd))
* **report:** added shorthand to scroll with elastic ([e7751ad](https://github.com/ezpaarse-project/ezreeport/commit/e7751ad2974501eb793eaef7b664011a87961b25))
* **report:** added support for timezones in cron ([e442f8d](https://github.com/ezpaarse-project/ezreeport/commit/e442f8df5eaf43a9c9e74c2694812ea75f1e01bc))
* **report:** added support for username password if no apikey is found ([908c745](https://github.com/ezpaarse-project/ezreeport/commit/908c74509adcca70a267258f177546a0842752f0))
* **report:** better routes for queue management ([ee056a9](https://github.com/ezpaarse-project/ezreeport/commit/ee056a9a20f99d7991871214f557038019031e06))
* **report:** can create task for other institution ([27766fd](https://github.com/ezpaarse-project/ezreeport/commit/27766fd5a6cfd143009d6c5666fb7f88305a5a2c))
* **report:** can retrieve api version from health ([cafc414](https://github.com/ezpaarse-project/ezreeport/commit/cafc4146d640f1fd77830010c80d6b891e99e86d))
* **report:** including task in history list ([d5ce03c](https://github.com/ezpaarse-project/ezreeport/commit/d5ce03c0d0ac4ca16bfb3d2253d942ba24ec2b0e))
* separated dev & support team ([b89dbcc](https://github.com/ezpaarse-project/ezreeport/commit/b89dbcc4ed599d9347e0e82b1df6dd895a455a77))
* **vue:** added destroyAt in history data ([cf23621](https://github.com/ezpaarse-project/ezreeport/commit/cf23621ffdc9b02dbc1d3c5e69a483b37d71fe56))
* **vue:** moved from `Histoire` to `Storybook` ([4f41efe](https://github.com/ezpaarse-project/ezreeport/commit/4f41efefcd75c063fbc5dbfc63f03d15c191fb6c))


### Performance Improvements

* **report:** removed apm because metrics service is dropped ([f7bec53](https://github.com/ezpaarse-project/ezreeport/commit/f7bec5364a04baefe7f93db4ecbcf2476c7494fc))
