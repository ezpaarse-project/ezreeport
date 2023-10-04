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
  '[crons]: Test read features',
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
          'crons.getAllCrons()',
          () => {
            it(
              'Should get all crons',
              async () => {
                const res = await crons.getAllCrons();

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);
                expect(res.content).toBeInstanceOf(Array);

                const cron = res.content[0];
                expect(cron.name).toBeDefined();
                expect(cron.running).toBeDefined();
              },
            );
          },
        );

        describe(
          'crons.getCron(cronOrName)',
          () => {
            it(
              `Should get cron [${CRON_NAME}] by name`,
              async () => {
                const res = await crons.getCron(CRON_NAME);

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

                const cron = res.content;
                expect(cron.name).toBe(CRON_NAME);
                expect(cron.running).toBeDefined();
              },
            );

            it(
              'Cron [<random>] shouldn\'t be found',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await crons.getCron(NO_CRON_NAME);
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

        beforeAll(async () => {
          // Create an user for this test suite
          const { token, username: name } = await createUser();
          username = name;
          setup.login(token);
        });

        describe(
          'crons.getAllCrons()',
          () => {
            it(
              'Should throw a permission error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await crons.getAllCrons();
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
          'crons.getCron(cronOrName)',
          () => {
            it(
              'Should throw a permission error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await crons.getAllCrons();
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
          // Delete temp user
          await deleteUser(username);
        });
      },
    );

    describe(
      'As not logged in',
      () => {
        describe(
          'crons.getAllCrons()',
          () => {
            it(
              'Should throw a auth error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await crons.getAllCrons();
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
          },
        );

        describe(
          'crons.getCron(cronOrName)',
          () => {
            it(
              'Should throw a auth error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await crons.getAllCrons();
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
          },
        );
      },
    );
  },
);
