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
              'Should stop the cron',
              async () => {
                const res = await crons.updateCron({
                  name: 'generateReports',
                  running: false,
                });

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

                const cron = res?.content;
                expect(cron.name).toBeDefined();
                expect(cron.running).toBe(false);
              },
            );

            it(
              'Should start the cron',
              async () => {
                const res = await crons.updateCron({
                  name: 'generateReports',
                  running: true,
                });

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

                const cron = res?.content;
                expect(cron.name).toBeDefined();
                expect(cron.running).toBe(true);
                expect(cron.nextRun).toBeDefined();
              },
            );

            afterAll(async () => {
              // Resetting the cron
              await crons.updateCron({
                name: 'generateReports',
                running: true,
              });
            });
          },
        );

        describe(
          'crons.forceCron(cron)',
          () => {
            it(
              'Should run the cron',
              async () => {
                const res = await crons.forceCron('generateReports');
                const now = new Date();

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

                const cron = res?.content;
                expect(cron.name).toBeDefined();
                expect(cron.running).toBeDefined();
                expect(cron.lastRun).toBeDefined();

                const lastRun = (cron.lastRun?.getTime() ?? 0) / 1000;
                expect(lastRun).toBeCloseTo(now.getTime() / 1000);
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
          'crons.updateCron(cron)',
          () => {
            it(
              'Should throw a permission error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await crons.updateCron({ name: 'generateReports' });
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
                  await crons.forceCron('generateReports');
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
  },
);
