# ezreeport-report [1.0.0-beta.9](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-report@1.0.0-beta.8...ezreeport-report@1.0.0-beta.9) (2023-06-12)


### Bug Fixes

* **report:** fixed error with aggregations and size check ([4f39320](https://github.com/ezpaarse-project/ezreeport/commit/4f3932089009367f223c305fd02e40128737e9c0))


### Features

* **report:** added position of data labels ([d957f16](https://github.com/ezpaarse-project/ezreeport/commit/d957f165fb9d7dcea53b541f3d94a14550435d41))
* **report:** better way to order labels for metrics ([daffb91](https://github.com/ezpaarse-project/ezreeport/commit/daffb916de325d15065185b8b95f6b724ffcc70f))
* **report:** handle sub aggregation parsing ([fdd4b3d](https://github.com/ezpaarse-project/ezreeport/commit/fdd4b3de70e0859ed0fec695877805eeb3b607bc))

# ezreeport-report [1.0.0-beta.8](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-report@1.0.0-beta.7...ezreeport-report@1.0.0-beta.8) (2023-06-01)


### Bug Fixes

* **report:** fixed local images in markdown ([e3bfd29](https://github.com/ezpaarse-project/ezreeport/commit/e3bfd2935982848999ee9450ddb16f871cd5b8ff))


### Features

* **report:** explicit error when no data is fetched in elastic ([41cf8ee](https://github.com/ezpaarse-project/ezreeport/commit/41cf8ee8314cfcf317eba39ac9774ed78491d96f))

# ezreeport-report [1.0.0-beta.7](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-report@1.0.0-beta.6...ezreeport-report@1.0.0-beta.7) (2023-05-25)


### Bug Fixes

* **report:** fixed error on task enable/disable ([df98987](https://github.com/ezpaarse-project/ezreeport/commit/df9898780a53b80d5ea1c19faba3386043692eda))

# ezreeport-report [1.0.0-beta.6](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-report@1.0.0-beta.5...ezreeport-report@1.0.0-beta.6) (2023-05-25)


### Bug Fixes

* **report:** fixed mail date after report generation ([a07ffba](https://github.com/ezpaarse-project/ezreeport/commit/a07ffba155f6972f53b370a235667d8ab5ba86a8))


### Features

* **report:** added dummy namespace for admins when there's no namespace ([e839f37](https://github.com/ezpaarse-project/ezreeport/commit/e839f376e50a9b8174153457108fc6bbf5ed413b))
* **report:** when updating task, nextRun is now mandatory but can stay unchanged ([3a7e91d](https://github.com/ezpaarse-project/ezreeport/commit/3a7e91dbb72f9059ea99960abf37ae9fdbddd1d4))

# ezreeport-report [1.0.0-beta.5](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-report@1.0.0-beta.4...ezreeport-report@1.0.0-beta.5) (2023-04-25)


### Bug Fixes

* **report:** fixed link to ezmesure in pdfs ([55ef15c](https://github.com/ezpaarse-project/ezreeport/commit/55ef15c1bb6a0b6fd5a4d98655c7d99483011e2e))


### Features

* **report:** now correctly log access errors ([e27a80a](https://github.com/ezpaarse-project/ezreeport/commit/e27a80aa524fc0ab72d581045547992635cf3800))
* **report:** now detects when there's an error on elastic side when fetching data ([4681ef9](https://github.com/ezpaarse-project/ezreeport/commit/4681ef954cfe8972bf39a775119cdbb8d3cc0904))

# ezreeport-report [1.0.0-beta.4](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-report@1.0.0-beta.3...ezreeport-report@1.0.0-beta.4) (2023-04-24)


### Features

* **report:** 500 errors are now logged as app ([d49f463](https://github.com/ezpaarse-project/ezreeport/commit/d49f4636f94fec17bb3d7dd3cec2a5a12ece0a2e))

# ezreeport-report [1.0.0-beta.3](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-report@1.0.0-beta.2...ezreeport-report@1.0.0-beta.3) (2023-04-24)


### Bug Fixes

* **report:** add fix BulkUserMembership and BulkUser ([f770b2e](https://github.com/ezpaarse-project/ezreeport/commit/f770b2e2cb85f25c0eeeef6b27f3f0dcff146811))
* **report:** added username validation ([23cf921](https://github.com/ezpaarse-project/ezreeport/commit/23cf9218db1775dfb5a16698150f277cef6bf743))
* **report:** fixed crash when not authed ([724c715](https://github.com/ezpaarse-project/ezreeport/commit/724c7151e64f734264ec76b8231c788610e13f35))
* **report:** fixed docker cache issue ([8ff80cd](https://github.com/ezpaarse-project/ezreeport/commit/8ff80cdae236fb58d54d488d242701b3e084dd77))
* **report:** fixed error message when user not found ([414341d](https://github.com/ezpaarse-project/ezreeport/commit/414341df11d1405efe13effeeae645d0e02ed1ce))
* **report:** fixed error messages when namespace was not found ([bec3e11](https://github.com/ezpaarse-project/ezreeport/commit/bec3e11f94cbc25d3a6f9b4077252210d8ef17c6))
* **report:** fixed error when no namespace configured ([dbbabad](https://github.com/ezpaarse-project/ezreeport/commit/dbbabadd19f9c95c80ce4d7a15174b2abd43e262))
* **report:** fixed logs not writing in docker ([42cc9c4](https://github.com/ezpaarse-project/ezreeport/commit/42cc9c4e98bc9b666856d7962ee8319d8b398ad0))
* **report:** fixed namespace in user membership never found ([830d94d](https://github.com/ezpaarse-project/ezreeport/commit/830d94d446c0d23c886b31537f758b9a9610790f))
* **report:** namespaceId is no longer in memberships when getting namespaces ([31a338b](https://github.com/ezpaarse-project/ezreeport/commit/31a338bd1d3c394c02bde7fda13ccda15cb6eb29))
* **report:** update source of transaction in editUsers ([8b5119a](https://github.com/ezpaarse-project/ezreeport/commit/8b5119a427bf470a23bab452463c4d56c7238b78))
* **report:** use transaction for editUsers ([41ef9de](https://github.com/ezpaarse-project/ezreeport/commit/41ef9de88137344ffc0d3a08764c25590d33009d))


### Features

* **report:** actions on memberships returns concerned membership ([cf66e3e](https://github.com/ezpaarse-project/ezreeport/commit/cf66e3e241604f8703ceabdbb3c6395d7d5814c1))
* **report:** add a route for edit lot of users ([d3e88d5](https://github.com/ezpaarse-project/ezreeport/commit/d3e88d506364c0a8a62ec183bbd48bc9a8634c69))
* **report:** add route to replace lot of namespaces ([edee956](https://github.com/ezpaarse-project/ezreeport/commit/edee9567689146da037e6dc7ba3b63c4405b1824))
* **report:** added a way to get specific memberships ([0b45594](https://github.com/ezpaarse-project/ezreeport/commit/0b45594d411862e5415de6be8f488e76cccf9754))
* **report:** added init of templates ([8b74eb3](https://github.com/ezpaarse-project/ezreeport/commit/8b74eb3e497a2ecb402abb313f934a1bc3ff34d3))
* **report:** added tags for templates ([e6fc6a3](https://github.com/ezpaarse-project/ezreeport/commit/e6fc6a399c461ac0feb55af1952a4d86af2a77bc))
* **report:** namespaces id are no longer generated by API ([b91a4d8](https://github.com/ezpaarse-project/ezreeport/commit/b91a4d8c8bdc0c3882d2debb86a6d30a3ffbd147))
* **report:** put requests now create ressource if not found ([ccaceae](https://github.com/ezpaarse-project/ezreeport/commit/ccaceae6211859c20a93d8acabaf7df9e8b6d071))
* **report:** remove memberships if deleted ([a270596](https://github.com/ezpaarse-project/ezreeport/commit/a27059687d03b7d1c2acbadd8ec1d70491259021))
* **report:** splitted access & app logs ([9a6b745](https://github.com/ezpaarse-project/ezreeport/commit/9a6b7450972b50a54756e80111cdbe8ac056a0ff))


### Performance Improvements

* **report:** minor improvements on bulk replace of namespaces ([6ce2e42](https://github.com/ezpaarse-project/ezreeport/commit/6ce2e42eab50749a185423d62688767bea9a005c))
* **report:** using sets to reduce nested loops ([e2e10e1](https://github.com/ezpaarse-project/ezreeport/commit/e2e10e1a0172200a7be43fa645109392cd2f3d6b))

# ezreeport-report [1.0.0-beta.2](https://github.com/ezpaarse-project/ezreeport/compare/ezreeport-report@1.0.0-beta.1...ezreeport-report@1.0.0-beta.2) (2023-04-04)


### Bug Fixes

* **report:** cleaned up type issues ([92cb3c5](https://github.com/ezpaarse-project/ezreeport/commit/92cb3c5af8920c4e9bdcb0bb778fb443ab3e43cc))
* **report:** crons now needs admin instead of api key ([4fdd061](https://github.com/ezpaarse-project/ezreeport/commit/4fdd06115796d824697bf575db2d902023f84b00))
* **report:** fixed history count ([25a1b45](https://github.com/ezpaarse-project/ezreeport/commit/25a1b45ee291e9c5c436533eb08366d40490fae8))
* **report:** fixed history return type ([2780b98](https://github.com/ezpaarse-project/ezreeport/commit/2780b989452c2d6e77605f4d5c02912553564e96))
* **report:** fixed permissions issues about templates ([548b08f](https://github.com/ezpaarse-project/ezreeport/commit/548b08f25982eb8fcfcbbe4c9a03e0f4fe2a5a83))
* **report:** uniformized task return type ([2fbe854](https://github.com/ezpaarse-project/ezreeport/commit/2fbe8546a5fc529b4bfac1f20b9b172b98a55ef9))


### Code Refactoring

* **report:** moved api under versioned folder ([c4e9f3f](https://github.com/ezpaarse-project/ezreeport/commit/c4e9f3f9c3c98f25d5e2980456a8ac6d2afee3e6))


### Features

* **report:** added all routes into permission system ([188b8e5](https://github.com/ezpaarse-project/ezreeport/commit/188b8e5f5dceccdc0c591e98839b3f625a1e48b5))
* **report:** added route for getting all accessible namespaces ([d688ab0](https://github.com/ezpaarse-project/ezreeport/commit/d688ab00e4304ee0e5bcd835fab9162b294018ef))
* **report:** moving auth & institution management into DB ([4b48680](https://github.com/ezpaarse-project/ezreeport/commit/4b4868073ebfd40f9fe992793a648ed76b8d5459))
* **report:** templates are now in DB ([bf3eab4](https://github.com/ezpaarse-project/ezreeport/commit/bf3eab4b5693785923902d6c721d826f2d4b3e12))
* **vue:** switched to the new permission system ([a0a59a0](https://github.com/ezpaarse-project/ezreeport/commit/a0a59a050a216f1ca4a17060fb57395deb5c443a))


### BREAKING CHANGES

* **report:** routes that needs API KEY are under /admin

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
