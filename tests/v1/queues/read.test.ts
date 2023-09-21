import { randomBytes } from 'node:crypto';

import {
  describe,
  beforeAll,
  expect,
  it,
  afterAll,
} from '@jest/globals';
import { HttpStatusCode } from 'axios';

import { setup, queues, errorStatusMatcher } from '../../lib/sdk';
import { createUser, deleteUser } from '../../lib/admin';

const QUEUE_NAME = 'generation';
const NO_QUEUE_NAME = randomBytes(6).toString('hex');

describe(
  '[queues]: Test read features',
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
          'queues.getAllQueues()',
          () => {
            it(
              'Should get all queues',
              async () => {
                const res = await queues.getAllQueues();

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);
                expect(res.content).toBeInstanceOf(Array);

                const queue = res.content[0];
                expect(queue.name).toBeDefined();
                expect(queue.status).toBeDefined();
              },
            );
          },
        );

        describe(
          'queues.getQueueJobs(queueOrName)',
          () => {
            it(
              `Should get jobs of queue [${QUEUE_NAME}] by name`,
              async () => {
                const res = await queues.getQueueJobs(QUEUE_NAME);

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);
                expect(res.content).toBeInstanceOf(Array);

                const job = res.content[0];
                expect(job.id).toBeDefined();
                expect(job.status).toBeDefined();
                expect(job.progress).toBeDefined();
                expect(job.data).toBeDefined();
                expect(job.added).toBeDefined();
              },
            );

            it(
              'Queue [<random>] shouldn\'t be found',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.getQueueJobs(NO_QUEUE_NAME);
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

        describe(
          'queues.getJob(queueOrName, jobOrId)',
          () => {
            it(
              `Should get first job of queue [${QUEUE_NAME}] by name`,
              async () => {
                const { content: list } = await queues.getQueueJobs(QUEUE_NAME);
                const res = await queues.getJob(QUEUE_NAME, list[0].id);

                expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

                const job = res.content;
                expect(job.id).toBeDefined();
                expect(job.status).toBeDefined();
                expect(job.progress).toBeDefined();
                expect(job.data).toBeDefined();
                expect(job.added).toBeDefined();
                expect(job.attempts).toBeDefined();
              },
            );

            it(
              'Queue [<random>] shouldn\'t be found',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.getJob(NO_QUEUE_NAME, NO_QUEUE_NAME);
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

            it(
              `Job [<random>] in queue [${QUEUE_NAME}] shouldn't be found`,
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.getJob(QUEUE_NAME, NO_QUEUE_NAME);
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
        let userToken = '';

        beforeAll(async () => {
          // Create an user for this test suite
          ({ token: userToken, username } = await createUser());
          setup.login(userToken);
        });

        describe(
          'queues.getAllQueues()',
          () => {
            it(
              'Should throw a permission error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.getAllQueues();
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
          'queues.getQueue(queueOrName)',
          () => {
            it(
              'Should throw a permission error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.getAllQueues();
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
          'queues.getJob(queueOrName)',
          () => {
            let jobId: queues.Job<any>['id'];
            let admin = { token: '', username: '' };

            beforeAll(async () => {
              // Create an admin for this test suite
              (admin = await createUser({ isAdmin: true }));

              // Get first job
              setup.login(admin.token);
              jobId = (await queues.getQueueJobs(QUEUE_NAME)).content[0].id;

              // TODO: add membership

              setup.login(userToken);
            });

            // it(
            //   `Should get first allowed job of queue [${QUEUE_NAME}] by name`,
            //   async () => {
            //     const res = await queues.getJob(QUEUE_NAME, jobId);

            //     expect(res).toHaveProperty('status.code', HttpStatusCode.Ok);

            //     const job = res.content;
            //     expect(job.id).toBe(QUEUE_NAME);
            //     expect(job.status).toBeDefined();
            //     expect(job.progress).toBeDefined();
            //     expect(job.data).toBeDefined();
            //     expect(job.added).toBeDefined();
            //     expect(job.attempts).toBeDefined();
            //   },
            // );

            it(
              `First disallowed job of queue [${QUEUE_NAME}] shouldn't be accessible`,
              async () => {
                // TODO: remove membership

                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.getJob(QUEUE_NAME, jobId);
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
              'Queue [<random>] shouldn\'t be found',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.getJob(NO_QUEUE_NAME, jobId);
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

            it(
              `Job [<random>] in queue [${QUEUE_NAME}] shouldn't be found`,
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.getJob(QUEUE_NAME, jobId);
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
              // Delete admin
              deleteUser(admin.username);
            });
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
          'queues.getAllQueues()',
          () => {
            it(
              'Should throw a auth error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.getAllQueues();
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
          'queues.getQueue(queueOrName)',
          () => {
            it(
              'Should throw a auth error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.getQueueJobs(QUEUE_NAME);
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
          'queues.getJob(queueOrName, jobOrId)',
          () => {
            it(
              'Should throw a auth error',
              async () => {
                // Make test fails if call is successful
                expect.assertions(2);

                try {
                  await queues.getJob(QUEUE_NAME, NO_QUEUE_NAME);
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
