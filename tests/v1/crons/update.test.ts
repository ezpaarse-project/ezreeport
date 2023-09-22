import { randomBytes } from 'node:crypto';

import {
  describe,
  beforeAll,
  expect,
  it,
  afterAll,
} from '@jest/globals';
import { HttpStatusCode } from 'axios';

import { setup, crons, errorStatusMatcher } from '../../lib/sdk';
import { createUser, deleteUser } from '../../lib/admin';

const CRON_NAME = 'generateReports';
const NO_CRON_NAME = randomBytes(6).toString('hex');

describe(
  '[crons]: Test start/stop/force features',
  () => {
    describe(
      'As admin',
      () => {
        let username = '';

        beforeAll(async () => {
          // Create an admin for this test suite
          const { token, username: name } = await createUser({ isAdmin: true });
          username = name;
          setup.login(token);
        });

        describe(
          'crons.updateCron(cron)',
          () => {
            it(
              `Should stop cron [${CRON_NAME}]`,
              async () => {
                const res = await crons.updateCron({
                  name: CRON_NAME,
                  running: false,
                });

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

                const cron = res.content;
                expect(cron.name).toBe(CRON_NAME);
                expect(cron.running).toBe(false);
              },
            );

            it(
              `Should start cron [${CRON_NAME}]`,
              async () => {
                const res = await crons.updateCron({
                  name: CRON_NAME,
                  running: true,
                });

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

                const cron = res.content;
                expect(cron.name).toBe(CRON_NAME);
                expect(cron.running).toBe(true);
                expect(cron.nextRun).toBeInstanceOf(Date);
              },
            );

            it(
              'Cron [<random>] shouldn\'t be found',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await crons.updateCron({ name: NO_CRON_NAME });
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.NotFound),
                    );
                  }
                }
              },
            );

            afterAll(async () => {
              // Resetting the cron
              await crons.updateCron({
                name: CRON_NAME,
                running: true,
              });
            });
          },
        );

        describe(
          'crons.forceCron(cron)',
          () => {
            it(
              `Should run cron [${CRON_NAME}]`,
              async () => {
                const res = await crons.forceCron(CRON_NAME);
                const now = new Date();

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

                const cron = res.content;
                expect(cron.name).toBe(CRON_NAME);
                expect(cron.running).toBeDefined();
                expect(cron.lastRun).toBeInstanceOf(Date);

                const lastRun = (cron.lastRun?.getTime() ?? 0) / 1000;
                expect(lastRun).toBeCloseTo(now.getTime() / 1000);
              },
            );

            it(
              'Cron [<random>] shouldn\'t be found',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await crons.forceCron(NO_CRON_NAME);
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.NotFound),
                    );
                  }
                }
              },
            );
          },
        );

        afterAll(async () => {
          // Delete temp admin
          await deleteUser(username);
          setup.logout();
        });
      },
    );

    describe(
      'As user',
      () => {
        let username = '';
        let token = '';
        let adminToken = '';
        let adminUsername = '';
        let cron: crons.Cron | undefined;

        beforeAll(async () => {
          // Create an admin for this test suite
          ({ token: adminToken, username: adminUsername } = await createUser({ isAdmin: true }));

          // Get cron
          setup.login(adminToken);
          ({ content: cron } = await crons.getCron(CRON_NAME));

          // Create an user for this test suite
          ({ token, username } = await createUser());
        });

        describe(
          'crons.updateCron(cron)',
          () => {
            it(
              'Should throw a permission error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  setup.login(token);
                  await crons.updateCron({ name: CRON_NAME });
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.Forbidden),
                    );
                  }
                }
              },
            );

            it(
              `Cron [${CRON_NAME}] shouldn't be modified`,
              async () => {
                setup.login(adminToken);
                const { content: newCron } = await crons.getCron(CRON_NAME);
                setup.logout();

                expect(newCron).toStrictEqual(cron);
              },
            );

            it(
              'Should throw a permission error even if cron [<random>] doesn\'t exist',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  setup.login(token);
                  await crons.updateCron({ name: NO_CRON_NAME });
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.Forbidden),
                    );
                  }
                }
              },
            );
          },
        );

        describe(
          'crons.forceCron(cron)',
          () => {
            it(
              'Should throw a permission error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  setup.login(token);
                  await crons.forceCron(CRON_NAME);
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.Forbidden),
                    );
                  }
                }
              },
            );

            it(
              `Cron [${CRON_NAME}] shouldn't be modified`,
              async () => {
                setup.login(adminToken);
                const { content: newCron } = await crons.getCron(CRON_NAME);
                setup.logout();

                expect(newCron).toStrictEqual(cron);
              },
            );

            it(
              'Should throw a permission error even if [<random>] doesn\'t exist',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  setup.login(token);
                  await crons.forceCron(NO_CRON_NAME);
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.Forbidden),
                    );
                  }
                }
              },
            );
          },
        );

        afterAll(async () => {
          // Delete temp admin
          await deleteUser(adminUsername);
          // Delete temp user
          await deleteUser(username);
        });
      },
    );

    describe(
      'As not logged in',
      () => {
        let username = '';
        let adminToken = '';
        let cron: crons.Cron | undefined;

        beforeAll(async () => {
          // Create an admin for this test suite
          ({ token: adminToken, username } = await createUser({ isAdmin: true }));

          // Get cron
          setup.login(adminToken);
          ({ content: cron } = await crons.getCron(CRON_NAME));
        });

        describe(
          'crons.updateCron(cron)',
          () => {
            it(
              'Should throw a auth error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  setup.logout();
                  await crons.updateCron({ name: CRON_NAME });
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.Unauthorized),
                    );
                  }
                }
              },
            );

            it(
              `Cron [${CRON_NAME}] shouldn't be modified`,
              async () => {
                setup.login(adminToken);
                const { content: newCron } = await crons.getCron(CRON_NAME);
                setup.logout();

                expect(newCron).toStrictEqual(cron);
              },
            );
          },
        );

        describe(
          'crons.forceCron(cron)',
          () => {
            it(
              'Should throw a auth error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  setup.logout();
                  await crons.forceCron('generateReports');
                } catch (e) {
                  expect(e).toBeInstanceOf(Error);

                  if (e instanceof Error) {
                    expect(e.message).toMatch(
                      errorStatusMatcher(HttpStatusCode.Unauthorized),
                    );
                  }
                }
              },
            );

            it(
              `Cron [${CRON_NAME}] shouldn't be modified`,
              async () => {
                setup.login(adminToken);
                const { content: newCron } = await crons.getCron(CRON_NAME);
                setup.logout();

                expect(newCron).toStrictEqual(cron);
              },
            );
          },
        );

        afterAll(async () => {
          // Delete temp admin
          await deleteUser(username);
        });
      },
    );
  },
);
